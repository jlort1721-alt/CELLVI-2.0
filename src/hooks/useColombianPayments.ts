/**
 * Colombian Payments Hook - Wompi Integration
 *
 * Provides easy-to-use functions for Colombian payment methods:
 * - PSE (Bank transfers)
 * - Nequi (Mobile wallet)
 * - Payment status tracking
 *
 * @example
 * const { createPSEPayment, createNequiPayment, paymentStatus } = useColombianPayments();
 *
 * // Create PSE payment
 * const payment = await createPSEPayment({
 *   amount: 100000,
 *   bank_code: "1007", // Bancolombia
 *   user_legal_id: "1234567890",
 *   customer_email: "user@example.com"
 * });
 *
 * // Redirect user to PSE
 * window.location.href = payment.payment_url;
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = "pse" | "nequi" | "card" | "bancolombia";

export type PaymentStatus = "pending" | "processing" | "approved" | "declined" | "voided" | "error";

export type PSEUserType = "NATURAL" | "JURIDICA";

export type LegalIdType = "CC" | "CE" | "NIT" | "TI" | "PP";

export interface PSEBank {
  code: string;
  name: string;
  active: boolean;
}

export interface CreatePSEPaymentParams {
  amount: number;
  bank_code: string;
  user_type: PSEUserType;
  user_legal_id: string;
  user_legal_id_type: LegalIdType;
  customer_email: string;
  customer_full_name?: string;
  customer_phone?: string;
  invoice_id?: string;
  description?: string;
  redirect_url?: string;
}

export interface CreateNequiPaymentParams {
  amount: number;
  phone_number: string;
  customer_email: string;
  customer_full_name?: string;
  invoice_id?: string;
  description?: string;
  redirect_url?: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_url?: string;
  wompi_transaction_id?: string;
  created_at: string;
  paid_at?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useColombianPayments() {
  /**
   * Get list of available PSE banks
   */
  const { data: pseBanks, isLoading: banksLoading } = useQuery<PSEBank[]>({
    queryKey: ["pse-banks"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pse_banks");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60 * 24, // Banks list rarely changes - cache for 24 hours
  });

  /**
   * Create PSE payment (Bank transfer)
   */
  const createPSEPayment = useMutation({
    mutationFn: async (params: CreatePSEPaymentParams): Promise<PaymentTransaction> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wompi-payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: params.amount,
            currency: "COP",
            payment_method: "pse",
            customer_email: params.customer_email,
            customer_full_name: params.customer_full_name,
            customer_phone: params.customer_phone,
            invoice_id: params.invoice_id,
            description: params.description,
            redirect_url: params.redirect_url,
            pse_bank_code: params.bank_code,
            pse_user_type: params.user_type,
            pse_user_legal_id: params.user_legal_id,
            pse_user_legal_id_type: params.user_legal_id_type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const result = await response.json();
      return result.transaction;
    },
    onSuccess: () => {
      toast.success("Pago PSE creado", {
        description: "Serás redirigido a tu banco para completar el pago",
      });
    },
    onError: (error: Error) => {
      toast.error("Error al crear pago PSE", {
        description: error.message,
      });
    },
  });

  /**
   * Create Nequi payment (Mobile wallet)
   */
  const createNequiPayment = useMutation({
    mutationFn: async (params: CreateNequiPaymentParams): Promise<PaymentTransaction> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Validate Colombian mobile number format
      if (!/^3\d{9}$/.test(params.phone_number)) {
        throw new Error("Número de Nequi inválido. Debe ser un celular colombiano (10 dígitos, iniciando con 3)");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wompi-payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: params.amount,
            currency: "COP",
            payment_method: "nequi",
            customer_email: params.customer_email,
            customer_full_name: params.customer_full_name,
            invoice_id: params.invoice_id,
            description: params.description,
            redirect_url: params.redirect_url,
            nequi_phone_number: params.phone_number,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const result = await response.json();
      return result.transaction;
    },
    onSuccess: () => {
      toast.success("Pago Nequi creado", {
        description: "Recibirás una notificación en tu app Nequi",
      });
    },
    onError: (error: Error) => {
      toast.error("Error al crear pago Nequi", {
        description: error.message,
      });
    },
  });

  /**
   * Get payment status
   */
  const getPaymentStatus = (transactionId: string | null) => {
    return useQuery<PaymentTransaction>({
      queryKey: ["payment-status", transactionId],
      queryFn: async () => {
        if (!transactionId) throw new Error("No transaction ID");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wompi-payments/${transactionId}`,
          {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get payment status");
        }

        const result = await response.json();
        return result.transaction;
      },
      enabled: !!transactionId,
      refetchInterval: (data) => {
        // Poll every 5 seconds while payment is pending
        if (data && (data.status === "pending" || data.status === "processing")) {
          return 5000;
        }
        return false;
      },
    });
  };

  /**
   * Get payment transactions for current tenant
   */
  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["payment-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          *,
          invoice:invoices(id, amount, status)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  /**
   * Format Colombian currency (COP)
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Get payment status badge color
   */
  const getStatusColor = (status: PaymentStatus): string => {
    const colors: Record<PaymentStatus, string> = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      approved: "bg-green-500",
      declined: "bg-red-500",
      voided: "bg-gray-500",
      error: "bg-red-700",
    };
    return colors[status] || "bg-gray-500";
  };

  /**
   * Get payment status label in Spanish
   */
  const getStatusLabel = (status: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      pending: "Pendiente",
      processing: "Procesando",
      approved: "Aprobado",
      declined: "Rechazado",
      voided: "Anulado",
      error: "Error",
    };
    return labels[status] || status;
  };

  /**
   * Get bank name from code
   */
  const getBankName = (bankCode: string): string => {
    const bank = pseBanks?.find((b) => b.code === bankCode);
    return bank?.name || bankCode;
  };

  return {
    // Mutations
    createPSEPayment: createPSEPayment.mutateAsync,
    createNequiPayment: createNequiPayment.mutateAsync,

    // Queries
    pseBanks: pseBanks || [],
    banksLoading,
    transactions: transactions || [],
    getPaymentStatus,
    refetchTransactions,

    // Loading states
    isCreatingPSE: createPSEPayment.isPending,
    isCreatingNequi: createNequiPayment.isPending,

    // Utilities
    formatCurrency,
    getStatusColor,
    getStatusLabel,
    getBankName,
  };
}

/**
 * Hook for payment status page
 * Automatically checks URL parameters for transaction ID
 */
export function usePaymentStatusPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get("id");

  const { data: payment, isLoading, error } = useColombianPayments().getPaymentStatus(transactionId);

  return {
    payment,
    isLoading,
    error,
    transactionId,
  };
}
