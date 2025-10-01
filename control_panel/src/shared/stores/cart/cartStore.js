import { create } from 'zustand';
const useCartStore = create(() => ({ items: [] }));
export default useCartStore;
