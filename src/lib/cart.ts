"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartPaperItem {
  id: string;
  title: string;
  unitCode?: string | null;
  course?: string | null;
  topic?: string | null;
  price: number;
}

const CART_STORAGE_KEY = "kcse_cart";
const CART_EVENT = "kcse_cart_change";
const CART_OPEN_EVENT = "kcse_cart_open";

export function getStoredCart(): CartPaperItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartPaperItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
  } catch {
    // Storage unavailable
  }
}

export function addPaperToCart(item: CartPaperItem): boolean {
  const current = getStoredCart();
  const exists = current.some((p) => p.id === item.id);
  if (exists) return false;

  const updated = [
    ...current,
    {
      id: item.id,
      title: item.title,
      unitCode: item.unitCode || "KCSE",
      course: item.course || "National Exam",
      topic: item.topic || "Examination Paper",
      price: Number(item.price) || 250,
    },
  ];
  saveCart(updated);
  return true;
}

export function removePaperFromCart(id: string): void {
  const current = getStoredCart();
  const updated = current.filter((p) => p.id !== id);
  saveCart(updated);
}

export function clearCart(): void {
  saveCart([]);
}

export function isPaperInCart(id: string): boolean {
  const current = getStoredCart();
  return current.some((p) => p.id === id);
}

export function triggerOpenCartDrawer(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
  }
}

export function useCart() {
  const [items, setItems] = useState<CartPaperItem[]>(() => getStoredCart());
  const isLoaded = true;

  useEffect(() => {
    const handleCartChange = () => {
      setItems(getStoredCart());
    };

    window.addEventListener(CART_EVENT, handleCartChange);
    window.addEventListener("storage", handleCartChange);

    return () => {
      window.removeEventListener(CART_EVENT, handleCartChange);
      window.removeEventListener("storage", handleCartChange);
    };
  }, []);

  const total = items.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const count = items.length;

  const addItem = useCallback((item: CartPaperItem) => {
    return addPaperToCart(item);
  }, []);

  const removeItem = useCallback((id: string) => {
    removePaperFromCart(id);
  }, []);

  const emptyCart = useCallback(() => {
    clearCart();
  }, []);

  const checkInCart = useCallback((id: string) => {
    return items.some((p) => p.id === id);
  }, [items]);

  return {
    items,
    count,
    total,
    isLoaded,
    addItem,
    removeItem,
    clearCart: emptyCart,
    isInCart: checkInCart,
    openCart: triggerOpenCartDrawer,
  };
}
