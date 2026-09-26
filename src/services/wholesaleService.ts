import apiClient, {
  BackendRFQ,
  BackendRFQListResponse,
  BackendQuote,
  CreateRFQPayload,
  RFQRevisionPayload,
  CreateQuotePayload,
  UpdateQuotePayload,
  AcceptQuoteResponse,
} from '@/lib/api';

/**
 * =========================================================================
 * WHOLESALE & RFQ SERVICE (Phase 2F)
 * =========================================================================
 * Authoritative frontend client interface for institutional RFQs,
 * contractor quotes, revisions, and bulk procurement checkout.
 */

export const wholesaleService = {
  /**
   * Customer: Create a new RFQ (draft or submitted).
   */
  async createRFQ(payload: CreateRFQPayload): Promise<BackendRFQ> {
    try {
      const res = await apiClient.rfqs.create(payload);
      if (res.data) return res.data;
      throw new Error('Failed to create RFQ request.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create RFQ request. Please try again.');
    }
  },

  /**
   * Customer: List user's RFQs with optional status filter.
   */
  async listUserRFQs(params: { page?: number; pageSize?: number; status?: string } = {}): Promise<BackendRFQListResponse> {
    try {
      const res = await apiClient.rfqs.list(params);
      if (res.data) return res.data;
      throw new Error('Failed to load RFQ requests.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to load RFQ requests.');
    }
  },

  /**
   * Customer: Get RFQ by ID or number.
   */
  async getRFQ(rfqId: string): Promise<BackendRFQ> {
    try {
      const res = await apiClient.rfqs.get(rfqId);
      if (res.data) return res.data;
      throw new Error(`RFQ '${rfqId}' not found.`);
    } catch (err: any) {
      throw new Error(err.message || 'Unable to retrieve RFQ details.');
    }
  },

  /**
   * Customer: Submit a draft RFQ.
   */
  async submitRFQ(rfqId: string): Promise<BackendRFQ> {
    try {
      const res = await apiClient.rfqs.submit(rfqId);
      if (res.data) return res.data;
      throw new Error('Failed to submit RFQ.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit RFQ.');
    }
  },

  /**
   * Customer: Cancel an active RFQ.
   */
  async cancelRFQ(rfqId: string, reason?: string): Promise<BackendRFQ> {
    try {
      const res = await apiClient.rfqs.cancel(rfqId, reason);
      if (res.data) return res.data;
      throw new Error('Failed to cancel RFQ.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to cancel RFQ.');
    }
  },

  /**
   * Customer: Request a revision for a quotation.
   */
  async requestRevision(rfqId: string, payload: RFQRevisionPayload): Promise<BackendRFQ> {
    try {
      const res = await apiClient.rfqs.requestRevision(rfqId, payload);
      if (res.data) return res.data;
      throw new Error('Failed to submit revision request.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit revision request.');
    }
  },

  /**
   * Customer: List all quote revisions for an RFQ.
   */
  async listQuotes(rfqId: string): Promise<BackendQuote[]> {
    try {
      const res = await apiClient.rfqs.listQuotes(rfqId);
      if (res.data) return res.data;
      return [];
    } catch (err: any) {
      throw new Error(err.message || 'Failed to load quotes for RFQ.');
    }
  },

  /**
   * Customer: Get quote details.
   */
  async getQuote(quoteId: string): Promise<BackendQuote> {
    try {
      const res = await apiClient.quotes.get(quoteId);
      if (res.data) return res.data;
      throw new Error('Quote details not found.');
    } catch (err: any) {
      throw new Error(err.message || 'Unable to retrieve quote details.');
    }
  },

  /**
   * Customer: Accept quote and convert to real Order.
   */
  async acceptQuote(quoteId: string, params: { paymentMethod?: string; notes?: string } = {}): Promise<AcceptQuoteResponse> {
    try {
      const res = await apiClient.quotes.accept(quoteId, params);
      if (res.data) return res.data;
      throw new Error('Failed to accept quotation.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to accept quotation. Please try again.');
    }
  },

  /**
   * Customer: Reject quote.
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<BackendQuote> {
    try {
      const res = await apiClient.quotes.reject(quoteId, reason);
      if (res.data) return res.data;
      throw new Error('Failed to reject quote.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to reject quote.');
    }
  },

  /**
   * Staff: List admin RFQ queue.
   */
  async adminListRFQs(params: { page?: number; pageSize?: number; status?: string; search?: string } = {}): Promise<BackendRFQListResponse> {
    try {
      const res = await apiClient.adminRfqs.list(params);
      if (res.data) return res.data;
      throw new Error('Failed to load admin RFQ queue.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to load admin RFQ queue.');
    }
  },

  /**
   * Staff: Create a quotation for an RFQ.
   */
  async adminCreateQuote(rfqId: string, payload: CreateQuotePayload): Promise<BackendQuote> {
    try {
      const res = await apiClient.adminRfqs.createQuote(rfqId, payload);
      if (res.data) return res.data;
      throw new Error('Failed to create quotation.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create quotation.');
    }
  },

  /**
   * Staff: Revise an existing quotation.
   */
  async adminReviseQuote(quoteId: string, payload: CreateQuotePayload): Promise<BackendQuote> {
    try {
      const res = await apiClient.adminQuotes.revise(quoteId, payload);
      if (res.data) return res.data;
      throw new Error('Failed to create revised quotation.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create revised quotation.');
    }
  },

  /**
   * Staff: Send a quotation to customer.
   */
  async adminSendQuote(quoteId: string): Promise<BackendQuote> {
    try {
      const res = await apiClient.adminQuotes.send(quoteId);
      if (res.data) return res.data;
      throw new Error('Failed to publish quote.');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to publish quote.');
    }
  },
};

export default wholesaleService;
