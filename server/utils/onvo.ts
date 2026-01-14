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
        cancelUrl?: string;
        lineItems?: any[];
        metadata?: Record<string, any>;
    }) {
        return this.request<{ url: string; id: string }>('/checkout/sessions/one-time-link', 'POST', payload);
    }

    async createSubscription(payload: {
        customerId: string;
        items: Array<{ priceId?: string; unitAmount?: number; currency?: string; quantity?: number }>;
        billingCycleAnchor?: string;
        paymentBehavior?: 'allow_incomplete' | 'default_incomplete';
        paymentMethodId?: string;
        returnUrl?: string;
    }) {
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
