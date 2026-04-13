export class Product {
    product_id: number;
    product_name: string;
    brand_id: number;
    category_id: number;
    price: number;
    quantity: number;
    description: string;
    image_url: string;
    PathAnh: string;
    cpu_chip?: string;
    gpu?: string;
    ram_gb?: number;
    storage_gb?: number;
    battery_mah?: number;
    fast_charge_w?: number;
    rear_camera_mp?: number;
    front_camera_mp?: number;
    screen_size_inch?: number;
    screen_resolution?: string;
    refresh_rate_hz?: number;
}
