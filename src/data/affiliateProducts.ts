import { AffiliateProduct } from '../types';

export const DEFAULT_AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'aff-sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Wireless ANC Headphones',
    category: 'Headphones & ANC',
    price: '$198.00',
    originalPrice: '$399.99',
    discountPercent: '-50%',
    rating: 4.9,
    reviewsCount: '24.8k',
    description: 'Industry-leading noise cancellation with dual processors, 8 microphones, 30-hour battery, and ultra-crisp LDAC Hi-Res Audio.',
    affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH?tag=musicplayer-affiliate-20',
    badge: '🔥 BEST SELLER',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aff-lossless-hifi-dac',
    title: 'Lossless Hi-Fi USB-C to 3.5mm DAC Adapter',
    category: 'Audiophile DACs',
    price: '$18.99',
    originalPrice: '$32.00',
    discountPercent: '-41%',
    rating: 4.8,
    reviewsCount: '9.4k',
    description: 'Hardware 32-Bit/384kHz high-resolution DAC chip. Unlocks studio-grade dynamic range and zero hiss on any Android device.',
    affiliateUrl: 'https://www.amazon.com/s?k=usb+c+dac+lossless+audio&tag=musicplayer-affiliate-20',
    badge: '⚡ AUDIOPHILE PICK',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aff-studio-usb-mic',
    title: 'Studio Cardioid USB Vocal & Recording Microphone',
    category: 'Mics & Recording',
    price: '$46.99',
    originalPrice: '$79.99',
    discountPercent: '-41%',
    rating: 4.8,
    reviewsCount: '13.2k',
    description: 'Professional condenser microphone with heavy-duty boom arm, dual pop filter, zero-latency headphone monitoring for singing & vocals.',
    affiliateUrl: 'https://www.amazon.com/s?k=usb+condenser+microphone+recording&tag=musicplayer-affiliate-20',
    badge: '🎤 STUDIO GEAR',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aff-kz-zsn-pro-iem',
    title: 'KZ ZSN Pro Dual Driver In-Ear Audio Monitors (IEMs)',
    category: 'In-Ear Monitors',
    price: '$22.50',
    originalPrice: '$38.00',
    discountPercent: '-41%',
    rating: 4.9,
    reviewsCount: '18.1k',
    description: 'Custom hybrid dynamic + balanced armature drivers. Delivers thunderous sub-bass and crystal-clear instrument separation on mobile.',
    affiliateUrl: 'https://www.amazon.com/s?k=kz+zsn+pro+iem+earphones&tag=musicplayer-affiliate-20',
    badge: '⭐ TOP RATED',
    imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aff-jbl-clip-speaker',
    title: 'JBL Clip 4 Portable Waterproof Bluetooth Speaker',
    category: 'Bluetooth Speakers',
    price: '$49.95',
    originalPrice: '$79.95',
    discountPercent: '-38%',
    rating: 4.7,
    reviewsCount: '34.2k',
    description: 'Legendary punchy JBL Original Pro Sound in a rugged carabiner clip body. 10 hours playtime, IP67 waterproof and dustproof.',
    affiliateUrl: 'https://www.amazon.com/s?k=jbl+clip+4+bluetooth+speaker&tag=musicplayer-affiliate-20',
    badge: '🔊 TRAVEL FAVORITE',
    imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'aff-headphone-stand-desk',
    title: 'Aerospace Aluminum Headphone Stand & Cable Dock',
    category: 'Accessories',
    price: '$12.99',
    originalPrice: '$21.99',
    discountPercent: '-41%',
    rating: 4.7,
    reviewsCount: '8.6k',
    description: 'Solid sandblasted aluminum alloy stand with cushioned silicone cradle that preserves headband shape and organizes your cords.',
    affiliateUrl: 'https://www.amazon.com/s?k=headphone+stand+desk+aluminum&tag=musicplayer-affiliate-20',
    badge: '💡 ESSENTIAL',
    imageUrl: 'https://images.unsplash.com/photo-1584679109597-c656b19974c9?w=500&auto=format&fit=crop&q=80',
  },
];

const STORAGE_KEY = 'sonance_music_affiliate_products_v1';

export function loadAffiliateProducts(): AffiliateProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse saved affiliate products', err);
  }
  return DEFAULT_AFFILIATE_PRODUCTS;
}

export function saveAffiliateProducts(products: AffiliateProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save affiliate products', err);
  }
}

export function resetAffiliateProducts(): AffiliateProduct[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset affiliate products', err);
  }
  return DEFAULT_AFFILIATE_PRODUCTS;
}
