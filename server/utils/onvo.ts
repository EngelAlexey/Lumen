export class OnvoClient {
    private secretKey: string;
    private baseUrl: string = 'https://api.onvopay.com/v1';

    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    private async request<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any): Promise<T> {
        const headers = {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[OnvoClient] Error requesting ${endpoint}:`, response.status, errorData);
                throw new Error(errorData.message || `Onvo API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`[OnvoClient] Request failed:`, error);
            throw error;
        }
    }

    async createCheckoutLink(payload: {
        customerName?: string;
        customerEmail?: string;
        redirectUrl: string;
        cancelUrl?: string; // Not always documented but common
        lineItems?: any[];
        metadata?: Record<string, any>;
    }) {
        // Based on: POST /checkout/sessions/one-time-link
        /*
         Docs say:
         customerName
         customerEmail
         redirectUrl
         lineItems: [{ description, unitAmount, currency, quantity }]
         metadata
        */
        return this.request<{ url: string; id: string }>('/checkout/sessions/one-time-link', 'POST', payload);
    }

    // Since we need to support Subscriptions, and if Checkout doesn't support them directly,
    // we might need to use the Recurring Charges API directly.
    // Based on user input: POST /subscriptions (implied from "Crear un Cargo recurrente")
    async createSubscription(payload: {
        customerId: string;
        items: Array<{ priceId?: string; unitAmount?: number; currency?: string; quantity?: number }>;
        billingCycleAnchor?: string;
        paymentBehavior?: 'allow_incomplete' | 'default_incomplete';
        paymentMethodId?: string; // Required if not allow_incomplete
        returnUrl?: string; // If using a flow that redirects
    }) {
        // Assumption: endpoint is /subscriptions based on "Crear un Cargo recurrente" context usually mapping to subscriptions
        // If the docs say "Recurring Charge", the endpoint might be /recurring-charges
        // I will use /subscriptions as a placeholder, if 404 I will check exact endpoint again.
        // User provided: "Crear un Cargo recurrente" -> likely POST /recurring-charges or /subscriptions.
        // Let's assume /subscriptions for now as per common REST standards for this resource.
        return this.request<any>('/subscriptions', 'POST', payload);
    }

    async createCustomer(payload: {
        name: string;
        email: string;
        phone?: string;
    }) {
        return this.request<{ id: string }>('/customers', 'POST', payload);
    }
}

export const useOnvo = () => {
    const config = useRuntimeConfig();
    return new OnvoClient(config.onvoSecretKey as string);
}
