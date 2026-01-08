
import { PathaoConfig, Order } from "../types";

const SETTINGS_URL = "api/settings.php";
const PROXY_URL = "api/pathao_proxy.php";

const fetchSetting = async (key: string) => {
  try {
    const res = await fetch(`${SETTINGS_URL}?key=${key}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text === "null") return null;
    try {
      const data = JSON.parse(text);
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
};

const saveSetting = async (key: string, value: any) => {
  try {
    await fetch(SETTINGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: JSON.stringify(value) })
    });
  } catch (e) {
    console.error("Error saving Pathao setting:", e);
  }
};

export const getPathaoConfig = async (): Promise<PathaoConfig | null> => {
  const config = await fetchSetting('pathao_config');
  return config || {
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    storeId: '',
    isSandbox: true,
    webhookSecret: ''
  };
};

export const savePathaoConfig = async (config: PathaoConfig) => {
  await saveSetting('pathao_config', config);
};

export const mapPathaoEventToStatus = (event: string): Order['status'] => {
  const e = event.toLowerCase();
  if (e.includes('delivered') || e.includes('paid')) return 'Delivered';
  if (e.includes('returned') || e.includes('failed')) return 'Returned';
  if (e.includes('cancelled') || e.includes('rejected')) return 'Rejected';
  if (e.includes('transit') || e.includes('sorting') || e.includes('assigned') || e.includes('picked')) return 'Shipping';
  if (e.includes('created') || e.includes('requested')) return 'Packaging';
  return 'Pending';
};

async function pathaoRequest(endpoint: string, method: string = 'GET', body: any = null) {
  const config = await getPathaoConfig();
  if (!config || !config.clientId || !config.clientSecret) {
    return { error: true, message: "Pathao Client ID or Secret missing in settings." };
  }

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        endpoint,
        method,
        data: body
      })
    });

    const result = await response.json();
    
    // Pathao documentation success codes can be 200, 201, 202
    const successCodes = [200, 201, 202];
    const resultCode = parseInt(result.code);

    if (!successCodes.includes(resultCode)) {
      let errorMessage = result.message || "Pathao API Error";
      // Extract specific field errors if available
      if (result.errors && typeof result.errors === 'object') {
        const errorDetails = Object.entries(result.errors)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val[0] : val}`)
          .join(', ');
        errorMessage = errorDetails;
      }
      return { error: true, message: errorMessage, code: resultCode };
    }

    return result;
  } catch (error: any) {
    console.error(`Pathao API Request Failed (${endpoint}):`, error);
    return { error: true, message: "Connection to Proxy failed." };
  }
}

export const checkPathaoConnection = async (): Promise<{ success: boolean; message: string }> => {
  const res = await pathaoRequest('aladdin/api/v1/stores', 'GET');
  if (res.error) return { success: false, message: res.message };
  return { success: true, message: "Connected to Pathao successfully!" };
};

export const getPathaoCities = async () => {
  const res = await pathaoRequest('aladdin/api/v1/city-list', 'GET');
  return res.data?.data || res.data || [];
};

export const getPathaoZones = async (cityId: number) => {
  const res = await pathaoRequest(`aladdin/api/v1/cities/${cityId}/zone-list`, 'GET');
  return res.data?.data || res.data || [];
};

export const getPathaoAreas = async (zoneId: number) => {
  const res = await pathaoRequest(`aladdin/api/v1/zones/${zoneId}/area-list`, 'GET');
  return res.data?.data || res.data || [];
};

export const createPathaoOrder = async (order: Order, location: { city: number, zone: number, area: number }) => {
  const config = await getPathaoConfig();
  if (!config) throw new Error("Pathao config missing");

  // Documentation: Recipient phone length must be 11 characters
  let cleanPhone = order.customer.phone.trim().replace(/[^\d]/g, '');
  if (cleanPhone.startsWith('88')) {
    cleanPhone = cleanPhone.substring(2);
  }
  // Ensure it's exactly 11 digits (BD standard)
  if (cleanPhone.length > 11) {
    cleanPhone = cleanPhone.slice(-11);
  } else if (cleanPhone.length < 11 && !cleanPhone.startsWith('0')) {
    cleanPhone = '0' + cleanPhone;
  }

  const payload = {
    store_id: parseInt(config.storeId), // Must be integer
    merchant_order_id: order.id,
    recipient_name: order.customer.name.substring(0, 50),
    recipient_phone: cleanPhone,
    recipient_address: order.address.substring(0, 120), // Documentation says max 120 for store, 220 for order
    recipient_city: location.city,
    recipient_zone: location.zone,
    recipient_area: location.area,
    delivery_type: 48, // Normal Delivery
    item_type: 2, // Parcel
    item_quantity: Math.max(1, order.products.reduce((acc, p) => acc + p.qty, 0)),
    item_weight: 0.5, // Float between 0.5 and 10
    amount_to_collect: Math.round(order.total), // Integer
    item_description: order.products.map(p => p.name).join(', ').substring(0, 200)
  };

  return await pathaoRequest('aladdin/api/v1/orders', 'POST', payload);
};
