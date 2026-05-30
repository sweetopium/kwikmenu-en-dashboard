const parseApiError = async (response, fallbackMessage) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new Error(fallbackMessage);
  }

  try {
    const payload = JSON.parse(text);
    throw new Error(payload.detail || payload.message || fallbackMessage);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(text);
    }
    throw error;
  }
};

const billingFetch = async (path, options = {}) => {
  const response = await fetch(`/api/billing${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    await parseApiError(response, `Billing request failed with status ${response.status}`);
  }

  return response.json();
};

export const fetchBillingSummary = () => billingFetch('/me');

export const createBillingCheckout = (planCode) =>
  billingFetch('/checkout', {
    method: 'POST',
    body: JSON.stringify({ planCode }),
  });

export const cancelBillingSubscription = () =>
  billingFetch('/cancel', {
    method: 'POST',
  });

export const syncBillingTransaction = (paymentId) =>
  billingFetch(`/transactions/${paymentId}/sync`, {
    method: 'POST',
  });

export const syncBillingTransactionByUnitPayId = (unitpayPaymentId) =>
  billingFetch(`/transactions/unitpay/${unitpayPaymentId}/sync`, {
    method: 'POST',
  });
