import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AffiliateProduct } from '../types';
import {
  DEFAULT_AFFILIATE_PRODUCTS,
  loadAffiliateProducts as loadLocalProducts,
  saveAffiliateProducts as saveLocalProducts,
} from '../data/affiliateProducts';

const PRODUCTS_COLLECTION = 'affiliate_products';
const CONFIG_COLLECTION = 'affiliate_config';
const GLOBAL_CONFIG_DOC = 'global';

/**
 * Subscribes to real-time updates from Firestore.
 * When the app owner updates or adds a product in the cloud,
 * EVERY user running the app anywhere in the world receives the new product instantly.
 */
export function subscribeToCloudAffiliateProducts(
  onUpdate: (products: AffiliateProduct[], isCloudConnected: boolean) => void
): () => void {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Cloud database is empty, seed defaults so new users have products immediately
          seedDefaultProductsToCloud().catch((err) =>
            console.warn('[AffiliateFeed] Auto-seed failed:', err)
          );
          const local = loadLocalProducts();
          onUpdate(local, true);
          return;
        }

        const cloudProducts: AffiliateProduct[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AffiliateProduct;
          cloudProducts.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Save to local cache for instant offline startup
        saveLocalProducts(cloudProducts);
        onUpdate(cloudProducts, true);
      },
      (error) => {
        console.warn('[AffiliateFeed] Real-time cloud sync warning:', error.message);
        // Fallback to locally cached products
        const local = loadLocalProducts();
        onUpdate(local, false);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[AffiliateFeed] Failed to subscribe to cloud:', err);
    const local = loadLocalProducts();
    onUpdate(local, false);
    return () => {};
  }
}

/**
 * Seeds the curated default music gear products to Firestore if empty.
 */
export async function seedDefaultProductsToCloud(): Promise<void> {
  try {
    const batch = writeBatch(db);
    DEFAULT_AFFILIATE_PRODUCTS.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(docRef, {
        ...prod,
        order: index,
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
    console.log('[AffiliateFeed] Successfully seeded initial cloud products.');
  } catch (err) {
    console.warn('[AffiliateFeed] Cloud seed could not complete:', err);
  }
}

/**
 * Saves or updates a product in the cloud feed.
 * All app users will see this new or edited product within seconds!
 */
export async function saveProductToCloud(product: AffiliateProduct): Promise<boolean> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(
      docRef,
      {
        ...product,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('[AffiliateFeed] Failed to save product to cloud:', err);
    // Fallback: save locally
    const current = loadLocalProducts();
    const updated = [product, ...current.filter((p) => p.id !== product.id)];
    saveLocalProducts(updated);
    return false;
  }
}

/**
 * Deletes a product from the cloud feed.
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('[AffiliateFeed] Failed to delete product from cloud:', err);
    const current = loadLocalProducts();
    const updated = current.filter((p) => p.id !== productId);
    saveLocalProducts(updated);
    return false;
  }
}

/**
 * Updates the global affiliate partner tag and updates all existing cloud products.
 */
export async function updateGlobalAffiliateTag(tag: string): Promise<boolean> {
  const cleanTag = tag.trim().replace(/^tag=/, '');
  try {
    // Save to config
    const configRef = doc(db, CONFIG_COLLECTION, GLOBAL_CONFIG_DOC);
    await setDoc(
      configRef,
      {
        globalAffiliateTag: cleanTag,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update all products in Firestore to use this tag
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        const prod = docSnap.data() as AffiliateProduct;
        let url = prod.affiliateUrl;
        if (url.includes('tag=')) {
          url = url.replace(/tag=[^&]+/, `tag=${cleanTag}`);
        } else {
          url += (url.includes('?') ? '&' : '?') + `tag=${cleanTag}`;
        }
        batch.update(docSnap.ref, { affiliateUrl: url });
      });
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.warn('[AffiliateFeed] Error updating global affiliate tag in cloud:', err);
    return false;
  }
}

/**
 * Fetches the global affiliate tag if stored in Firestore.
 */
export async function getGlobalAffiliateTag(): Promise<string | null> {
  try {
    const snapshot = await getDocs(collection(db, CONFIG_COLLECTION));
    let foundTag: string | null = null;
    snapshot.forEach((docSnap) => {
      if (docSnap.id === GLOBAL_CONFIG_DOC) {
        foundTag = docSnap.data().globalAffiliateTag || null;
      }
    });
    return foundTag;
  } catch (err) {
    return null;
  }
}
