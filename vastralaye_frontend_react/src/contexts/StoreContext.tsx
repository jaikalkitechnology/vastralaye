import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Product, User, CartItem, WishlistItem, Coupon, LoginResponse } from '@/types';
import { toast } from 'sonner';
import axios from 'axios';
import { BASE_URL } from '@/config';

// Import all API functions from apihelper
import {
  // Auth functions
  login as apiLogin,
  adminLogin as apiAdminLogin,
  signUp,
  getUserMe,
  adminMe,
  changePassword,
  forgotPassword,
  resetPassword,

  // Profile functions
  getProfile,
  updateProfile,
  uploadAvatar,

  // Wishlist functions
  getWishlist,
  addWishlistItem,
  deleteWishlistItem,

  // Order functions
  checkout,
  getOrderHistory,
  getOrderTracking,
  cancelOrder,

  // Product functions
  productsPublic,

  // Coupon functions
  couponsPublic,

  // Support functions
  submitSupport,
  addProductReview
} from '@/api/apihelper';

/** Most of one product a single order may carry. Infinity = no limit —
 *  every clamp and stepper guard reads this, so set a number here (it was
 *  2, then 5, at different times) to bring a ceiling back. */
export const MAX_QTY_PER_PRODUCT = Infinity;

interface StoreState {
  products: Product[];
  filteredProducts: Product[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  currentUser: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  /**
   * Has the stored token actually been checked against the API yet?
   *
   * Until this is true, `isLoggedIn: false` only means "not known yet" — it is
   * NOT evidence of a logged-out visitor. Guards that redirect on it will bounce
   * a legitimate refresh straight to /login, which is exactly what used to
   * happen on every admin page reload.
   */
  authChecked: boolean;
  searchQuery: string;
  users: User[];
  coupons: Coupon[];
  filters: {
    categories: string[];
    subcategories: string[];
    priceRange: [number, number];
    colors: string[];
    sizes: string[];
  };
  loading: boolean;
  authError: string | null;
}

type StoreAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_FILTERED_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: CartItem }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_TO_WISHLIST'; payload: WishlistItem }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_LOADING_STATE'; payload: boolean }
  | { type: 'SET_AUTH_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<StoreState['filters']> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_COUPONS'; payload: Coupon[] }
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'SET_AUTH_CHECKED' }
  | { type: 'SET_ADMIN_STATUS'; payload: boolean };

/**
 * Last known session, read straight out of localStorage.
 *
 * Restoring it synchronously is what lets a refresh land back on the page you
 * were on: the admin shell can render on the very first paint instead of
 * waiting a round-trip with nothing but `isLoggedIn: false` to go on. The
 * token is still validated against the API a moment later, and a bad one is
 * cleared — this only decides what's on screen while that's in flight.
 */
const restoreSession = (): { user: User | null; isAdmin: boolean } => {
  try {
    if (!localStorage.getItem('token')) return { user: null, isAdmin: false };
    const raw = localStorage.getItem('currentUser');
    return {
      user: raw ? (JSON.parse(raw) as User) : null,
      isAdmin: localStorage.getItem('isAdmin') === 'true',
    };
  } catch {
    // Private mode or hand-edited junk — fall back to a cold start.
    return { user: null, isAdmin: false };
  }
};

const restored = restoreSession();

const initialState: StoreState = {
  products: [],
  filteredProducts: [],
  cart: [],
  wishlist: [],
  currentUser: restored.user,
  isLoggedIn: restored.user !== null,
  isAdmin: restored.isAdmin,
  authChecked: false,
  searchQuery: '',
  users: [],
  coupons: [],
  filters: {
    categories: [],
    subcategories: [],
    priceRange: [0, 5000],
    colors: [],
    sizes: [],
  },
  loading: false,
  authError: null,
};

const getItemFromStorage = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return null;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

const storeReducer = (state: StoreState, action: StoreAction): StoreState => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'SET_FILTERED_PRODUCTS':
      return { ...state, filteredProducts: action.payload };

    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUser: action.payload,
        isLoggedIn: action.payload !== null
      };

    case 'SET_ADMIN_STATUS':
      return { ...state, isAdmin: action.payload };

    case 'SET_AUTH_CHECKED':
      return { ...state, authChecked: true };

    case 'SET_COUPONS':
      return { ...state, coupons: action.payload };

    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };

    case 'SET_LOADING_STATE':
      return { ...state, loading: action.payload };

    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.payload };

    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item =>
        item.productId === action.payload.productId &&
        item.color === action.payload.color &&
        item.size === action.payload.size
      );

      let newCart;
      if (existingItem) {
        newCart = state.cart.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: Math.min(
                  MAX_QTY_PER_PRODUCT,
                  item.quantity + action.payload.quantity
                ),
              }
            : item
        );
      } else {
        newCart = [
          ...state.cart,
          {
            ...action.payload,
            quantity: Math.min(MAX_QTY_PER_PRODUCT, action.payload.quantity),
          },
        ];
      }

      saveToStorage('cart', newCart);
      return { ...state, cart: newCart };
    }

    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter(item => item.id !== action.payload);
      saveToStorage('cart', newCart);
      return { ...state, cart: newCart };
    }

    case 'UPDATE_CART_ITEM': {
      const clamped = {
        ...action.payload,
        quantity: Math.max(
          1,
          Math.min(MAX_QTY_PER_PRODUCT, action.payload.quantity)
        ),
      };
      const newCart = state.cart.map(item =>
        item.id === clamped.id ? clamped : item
      );
      saveToStorage('cart', newCart);
      return { ...state, cart: newCart };
    }

    case 'CLEAR_CART':
      localStorage.removeItem('cart');
      return { ...state, cart: [] };

    case 'ADD_TO_WISHLIST': {
      const exists = state.wishlist.some(item =>
        Number(item.product_id) === Number(action.payload.product_id)
      );

      if (exists) return state;

      const newWishlist = [...state.wishlist, action.payload];
      saveToStorage("wishlist", newWishlist);
      return { ...state, wishlist: newWishlist };
    }


    case 'REMOVE_FROM_WISHLIST': {
      const newWishlist = state.wishlist.filter(
        item => Number(item.product_id) !== Number(action.payload)
      );
      saveToStorage("wishlist", newWishlist);
      return { ...state, wishlist: newWishlist };
    }


    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        searchQuery: ''
      };

    default:
      return state;
  }
};



interface StoreContextType {
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
  addToCart: (product: Product, quantity: number, color: string, size: string) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  login: (email: string, password: string, rememberMe: boolean, userType?: 'user' | 'admin') => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  applyGoogleSession: (token: string) => Promise<boolean>;
  register: (formData: FormData) => Promise<boolean>;
  logout: () => void;
  applyFilters: () => void;
  setRememberMe: React.Dispatch<React.SetStateAction<boolean>>;
  placeOrder: (payload: any) => Promise<any>;
  getOrders: () => Promise<any>;
  updateUserProfile: (payload: any) => Promise<any>;
  uploadUserAvatar: (formData: FormData) => Promise<any>;
  submitSupportMessage: (payload: any) => Promise<any>;
  addReview: (productId: string, payload: any) => Promise<any>;
  changeUserPassword: (oldPassword: string, newPassword: string) => Promise<any>;
  syncWishlistFromServer: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const [rememberMe, setRememberMe] = React.useState(false);

  // Sync wishlist from server


  const syncWishlistFromServer = async () => {
    if (!state.currentUser) return;

    try {
      // Fetch wishlist from backend
      const serverWishlist = await getWishlist(); // <-- implement this API call
      const localWishlist = getItemFromStorage('wishlist') || [];

      // Merge without duplicates
      const mergedWishlist = [
        ...serverWishlist,
        ...localWishlist.filter(
          (item: WishlistItem) =>
            !serverWishlist.some(s => Number(s.product_id) === Number(item.product_id))

        ),
      ];

      // Update state and localStorage
      dispatch({ type: 'SET_WISHLIST', payload: mergedWishlist });
      saveToStorage('wishlist', mergedWishlist);
    } catch (err) {
      console.error("Failed to sync wishlist:", err);
    }
  };

  useEffect(() => {
    const initializeWishlist = async () => {
      try {
        if (state.isLoggedIn) {
          // ✅ Fetch wishlist from backend for logged-in users
          await syncWishlistFromServer();
        } else {
          // ✅ Restore wishlist from localStorage for guest users
          const localWishlist = getItemFromStorage("wishlist") || [];
          dispatch({ type: "SET_WISHLIST", payload: localWishlist });
        }
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    };

    initializeWishlist();
  }, [state.isLoggedIn]);





useEffect(() => {
  const fetchInitialData = async () => {
    const start = Date.now(); // ⏱️ start timing here

    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: true });

      /* Validate the stored token first and in its own task. Route guards are
         blocked on this answer, so it must not queue behind the catalogue —
         and it must be marked checked the moment it settles, either way. */
      const token = localStorage.getItem('token');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      let isLoggedInNow = false;

      const session = (async () => {
        if (!token) {
          // No token is a definite answer: this visitor is logged out.
          dispatch({ type: 'SET_CURRENT_USER', payload: null });
          dispatch({ type: 'SET_ADMIN_STATUS', payload: false });
          dispatch({ type: 'SET_AUTH_CHECKED' });
          return;
        }
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const userData = isAdmin ? await adminMe() : await getUserMe();
          dispatch({ type: 'SET_ADMIN_STATUS', payload: isAdmin });
          dispatch({ type: 'SET_CURRENT_USER', payload: userData });
          saveToStorage('currentUser', userData);

          isLoggedInNow = true;
        } catch (err) {
          console.error('Token validation failed:', err);

          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAdmin');
          dispatch({ type: 'SET_CURRENT_USER', payload: null });
          dispatch({ type: 'SET_ADMIN_STATUS', payload: false });
          delete axios.defaults.headers.common['Authorization'];

          isLoggedInNow = false;
        } finally {
          dispatch({ type: 'SET_AUTH_CHECKED' });
        }
      })();

      // Fetch public data alongside it
      const [productsData, couponsData] = await Promise.all([
        productsPublic().catch(e => {
          console.error('Failed to fetch products:', e);
          return [];
        }),
        couponsPublic().catch(e => {
          // console.error('Failed to fetch coupons:', e);
          return [];
        }),
        session,
      ]);

      dispatch({ type: 'SET_PRODUCTS', payload: productsData });
      dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: productsData });
      dispatch({ type: 'SET_COUPONS', payload: couponsData });

      if (isLoggedInNow) {
        await syncWishlistFromServer();
      }

      // Load local cart & wishlist
      const cart = getItemFromStorage('cart') || [];
      const localWishlist = getItemFromStorage('wishlist') || [];

      cart.forEach((item: CartItem) =>
        dispatch({ type: 'ADD_TO_CART', payload: item })
      );

      if (!isLoggedInNow) {
        localWishlist.forEach((item: WishlistItem) =>
          dispatch({ type: 'ADD_TO_WISHLIST', payload: item })
        );
      }

    } catch (error) {
      console.error('Initialization error:', error);
      toast.error('Failed to initialize application data');

    } finally {
      // Belt and braces: a guard waiting on this must never hang, whatever
      // else went wrong above. Setting it twice is a no-op.
      dispatch({ type: 'SET_AUTH_CHECKED' });

      const elapsed = Date.now() - start;
      const MIN_LOADING_TIME = 800; // ✅ recommended

      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve =>
          setTimeout(resolve, MIN_LOADING_TIME - elapsed)
        );
      }

      dispatch({ type: 'SET_LOADING_STATE', payload: false });
    }
  };

  fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);



  const applyFilters = useCallback(() => {
    const { searchQuery, filters, products } = state;

    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        filters.categories.includes(product.category)
      );
    }

    // Price filter
    filtered = filtered.filter(product => {
      const price = product.discountPrice || product.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter(product =>
        product.colors.some(color => filters.colors.includes(color))
      );
    }

    // Size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(product =>
        product.sizes.some(size => filters.sizes.includes(size))
      );
    }

    dispatch({ type: 'SET_FILTERED_PRODUCTS', payload: filtered });
  }, [state.products, state.searchQuery, state.filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Cart functions
  const addToCart = (product: Product, quantity: number, color: string, size: string) => {
    const newCartItem: CartItem = {
      id: Date.now().toString(),
      productId: product.id,
      quantity,
      color,
      size,
      product, // Store product details for display
    };
    dispatch({ type: 'ADD_TO_CART', payload: newCartItem });
    // Success toast is owned by the caller (ProductCard, PDP, Wishlist…)
    // — toasting here too showed two "Added to cart" boxes per click,
    // and one per item during the wishlist bulk add. Same convention as
    // addToWishlist below.
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    toast.success('Removed from cart');
  };

  const updateCartItem = (id: string, quantity: number) => {
    const updatedItem = state.cart.find(item => item.id === id);
    if (updatedItem) {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { ...updatedItem, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Wishlist functions with API integration
const addToWishlist = async (productId: string) => {
  try {
    if (state.isLoggedIn) {
      const res = await addWishlistItem({ product_id: Number(productId) });

      dispatch({
        type: "ADD_TO_WISHLIST",
        payload: {
          id: res.id,
          product_id: Number(productId),
          product: res.product
        }
      });
    } else {
      // Guest user – localStorage
      dispatch({
        type: "ADD_TO_WISHLIST",
        payload: {
          id: Date.now().toString(),
          product_id: Number(productId),
        }
      });
    }

    // toast.success("Added to wishlist");
  } catch (error) {
    console.error(error);
    toast.error("Failed to add to wishlist");
  }
};





const removeFromWishlist = async (productId: string) => {
  const prev = [...state.wishlist];

  try {
    dispatch({ type: "REMOVE_FROM_WISHLIST", payload: productId });

    if (state.isLoggedIn) {
      await deleteWishlistItem(productId);

      // ✅ update localStorage immediately
      const updatedWishlist = prev.filter(
        item => Number(item.product_id) !== Number(productId)
      );
      saveToStorage("wishlist", updatedWishlist);

      // optional but safe
      await syncWishlistFromServer();
    } else {
      const local = getItemFromStorage("wishlist") || [];
      const updated = local.filter(
        (item: any) => Number(item.product_id) !== Number(productId)
      );
      saveToStorage("wishlist", updated);
    }

  } catch (error) {
    dispatch({ type: "SET_WISHLIST", payload: prev });
    toast.error("Failed to remove wishlist");
  }
};












  const isInWishlist = (productId: string) => {
return state.wishlist.some(item =>
  Number(item.product_id) === Number(productId));
  };

  // SINGLE login function for both ADMIN + USER
  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING_STATE", payload: true });
      dispatch({ type: "SET_AUTH_ERROR", payload: null });

      // ---------------------------
      //  STEP 1 → Try ADMIN login
      // ---------------------------
      try {
        const adminTokenResponse = await apiAdminLogin({ email, password });
        const token = adminTokenResponse.access_token;

        // Save token
        localStorage.setItem("token", token);
        localStorage.setItem("isAdmin", "true");
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Fetch admin details
        const adminData = await adminMe();

        dispatch({ type: "SET_CURRENT_USER", payload: adminData });
        dispatch({ type: "SET_ADMIN_STATUS", payload: true });

        saveToStorage("currentUser", adminData);

        toast.success("Admin logged in successfully");
        return true;
      } catch (adminErr) {
        console.warn("Not admin — trying user login...");
      }

      // ---------------------------
      //  STEP 2 → Try USER login
      // ---------------------------
      const userTokenResponse = await apiLogin({ email, password });
      const token = userTokenResponse.access_token;

      localStorage.setItem("token", token);
      localStorage.setItem("isAdmin", "false");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user profile
      const userData = await getUserMe();

      dispatch({ type: "SET_CURRENT_USER", payload: userData });
      dispatch({ type: "SET_ADMIN_STATUS", payload: false });

      saveToStorage("currentUser", userData);

      // Sync user wishlist
      await syncWishlistFromServer();

      toast.success("User logged in successfully");
      return true;

    } catch (error: any) {
      console.error("Login error →", error);
      const msg = error.response?.data?.detail || "Login failed";
      dispatch({ type: "SET_AUTH_ERROR", payload: msg });
      toast.error(msg);
      return false;

    } finally {
      dispatch({ type: "SET_LOADING_STATE", payload: false });
    }
  };




  /** Adopt a session the Google callback already minted (redirect flow). */
  const applyGoogleSession = async (token: string): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING_STATE", payload: true });
      localStorage.setItem("token", token);
      localStorage.setItem("isAdmin", "false");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const userData = await getUserMe();
      dispatch({ type: "SET_CURRENT_USER", payload: userData });
      dispatch({ type: "SET_ADMIN_STATUS", payload: false });
      saveToStorage("currentUser", userData);
      await syncWishlistFromServer();

      toast.success("Signed in with Google");
      return true;
    } catch (error: any) {
      localStorage.removeItem("token");
      const msg = error?.response?.data?.detail || "Google sign-in failed";
      dispatch({ type: "SET_AUTH_ERROR", payload: msg });
      toast.error(msg);
      return false;
    } finally {
      dispatch({ type: "SET_LOADING_STATE", payload: false });
    }
  };

  /** Exchange a Google ID token for our own session. Users only — an admin
      still signs in with a password. */
  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING_STATE", payload: true });
      dispatch({ type: "SET_AUTH_ERROR", payload: null });

      const res = await axios.post<any>(`${BASE_URL}/users/auth/google`, { credential });
      const token = res.data?.access_token;
      if (!token) throw new Error("Google sign-in did not return a session");

      localStorage.setItem("token", token);
      localStorage.setItem("isAdmin", "false");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const userData = await getUserMe();
      dispatch({ type: "SET_CURRENT_USER", payload: userData });
      dispatch({ type: "SET_ADMIN_STATUS", payload: false });
      saveToStorage("currentUser", userData);
      await syncWishlistFromServer();

      toast.success("Signed in with Google");
      return true;
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail || error?.message || "Google sign-in failed";
      dispatch({ type: "SET_AUTH_ERROR", payload: msg });
      toast.error(msg);
      return false;
    } finally {
      dispatch({ type: "SET_LOADING_STATE", payload: false });
    }
  };


  // Registration function (only for regular users)
  const register = async (formData: FormData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING_STATE', payload: true });
      dispatch({ type: 'SET_AUTH_ERROR', payload: null });

      // Use the signUp function from apihelper
      await signUp(formData);

      toast.success('Registered successfully. Please login.');
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
    dispatch({ type: 'SET_ADMIN_STATUS', payload: false });
    dispatch({ type: 'SET_WISHLIST', payload: [] });
    delete axios.defaults.headers.common['Authorization'];
    toast.info('You have successfully logged out.');
  };

  // Order functions
  const placeOrder = async (payload: any) => {
    try {
      const response = await checkout(payload);
      clearCart(); // Clear cart after successful order
      toast.success('Order placed successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to place order';
      toast.error(errorMessage);
      throw error;
    }
  };

  const getOrders = async () => {
    try {
      return await getOrderHistory();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch orders';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Profile functions
  const updateUserProfile = async (payload: any) => {
    try {
      const response = await updateProfile(payload);
      dispatch({ type: 'SET_CURRENT_USER', payload: response });
      toast.success('Profile updated successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  const uploadUserAvatar = async (formData: FormData) => {
    try {
      const response = await uploadAvatar(formData);
      // Refresh user data to get updated avatar
      let userData;
      if (state.isAdmin) {
        userData = await adminMe();
      } else {
        userData = await getUserMe();
      }
      dispatch({ type: 'SET_CURRENT_USER', payload: userData });
      toast.success('Avatar updated successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to upload avatar';
      toast.error(errorMessage);
      throw error;
    }
  };

  const changeUserPassword = async (oldPassword: string, newPassword: string) => {
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      toast.success('Password changed successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to change password';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Support and Reviews
  const submitSupportMessage = async (payload: any) => {
    try {
      const response = await submitSupport(payload);
      toast.success('Support message sent successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to send support message';
      toast.error(errorMessage);
      throw error;
    }
  };

  const addReview = async (productId: string, payload: any) => {
    try {
      const response = await addProductReview(productId, payload);
      toast.success('Review added successfully');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to add review';
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <StoreContext.Provider value={{
      state,
      dispatch,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      login,
      loginWithGoogle,
      applyGoogleSession,
      register,
      logout,
      applyFilters,
      setRememberMe,
      placeOrder,
      getOrders,
      updateUserProfile,
      uploadUserAvatar,
      submitSupportMessage,
      addReview,
      changeUserPassword,
      syncWishlistFromServer,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom Hook for using store context
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};