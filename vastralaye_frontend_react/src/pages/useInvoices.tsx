// hooks/useInvoices.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  Invoice, 
  InvoiceFilters, 
  InvoicesResponse,
  InvoiceListItem 
} from "@/types/index";
import {
  getOrderInvoice,
  getOrderInvoiceHtml,
  getInvoiceByNumber,
  getUserInvoices,
  printOrderInvoice
} from "@/api/apihelper";

interface UseInvoicesReturn {
  invoices: InvoiceListItem[];
  totalInvoices: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchInvoices: (filters?: InvoiceFilters) => Promise<void>;
  fetchInvoiceByOrder: (orderId: number) => Promise<Invoice | null>;
  fetchInvoiceByNumber: (invoiceNumber: string) => Promise<Invoice | null>;
  printInvoice: (orderId: number) => Promise<void>;
  getInvoiceHtml: (orderId: number) => Promise<string | null>;
}

export const useInvoices = (initialFilters?: InvoiceFilters): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialFilters?.page || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (filters?: InvoiceFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response: InvoicesResponse = await getUserInvoices(filters);
      setInvoices(response.invoices);
      setTotalInvoices(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceByOrder = useCallback(async (orderId: number): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const invoice = await getOrderInvoice(orderId);
      return invoice;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoice');
      console.error('Error fetching invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvoiceByNumber = useCallback(async (invoiceNumber: string): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const invoice = await getInvoiceByNumber(invoiceNumber);
      return invoice;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoice');
      console.error('Error fetching invoice:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const printInvoice = useCallback(async (orderId: number): Promise<void> => {
    try {
      await printOrderInvoice(orderId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to print invoice');
      console.error('Error printing invoice:', err);
    }
  }, []);

  const getInvoiceHtml = useCallback(async (orderId: number): Promise<string | null> => {
    try {
      const html = await getOrderInvoiceHtml(orderId);
      return html;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get invoice HTML');
      console.error('Error getting invoice HTML:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchInvoices(initialFilters);
  }, [fetchInvoices, initialFilters]);

  return {
    invoices,
    totalInvoices,
    currentPage,
    totalPages,
    loading,
    error,
    fetchInvoices,
    fetchInvoiceByOrder,
    fetchInvoiceByNumber,
    printInvoice,
    getInvoiceHtml
  };
};