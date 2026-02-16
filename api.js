function getToken() {
  const tokenKey = 'portfolioToken';
    const storedToken = localStorage.getItem(tokenKey);
    
    // Если токен уже существует в localStorage, вернуть его
    if (storedToken) {
        return storedToken;
    }
    
    // Если токена нет, сгенерировать новый и сохранить его в localStorage
    function generateRandomToken(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return token;
    }

    const newToken = generateRandomToken(16);
    localStorage.setItem(tokenKey, newToken);
    
    return newToken;
}
function getAccessToken() {
  return getToken();
}

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Guest-Token": getAccessToken(),
};

export function createPortfolio({ name, description, color, includeInTotal }) {
  return fetch('/en/api/portfolio', {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
    },
    body: JSON.stringify({
      name,
      description,
      color,
      include_in_total: includeInTotal,
    }),
  });
}

export function updatePortfolio({
  id,
  name,
  description,
  color,
  includeInTotal,
  show_small_balances,
  is_public,
}) {
  return fetch(`/en/api/portfolio/${id}`, {
    method: "PUT",
    headers: {
      ...JSON_HEADERS,
    },
    body: JSON.stringify({
      name,
      description,
      color,
      include_in_total: includeInTotal,
      show_small_balances,
      is_public,
    }),
  });
}

export function deletePortfolio({ id }) {
  return fetch(`/en/api/portfolio/${id}`, {
    method: "DELETE",
    headers: {
      ...JSON_HEADERS,
    },
  });
}

export function deleteAsset({ id, deleteRelatedTx }) {
  return fetch(`/en/api/portfolio-asset/${id}?delete_related_tx=${+deleteRelatedTx}`, {
    method: "DELETE",
    headers: {
      ...JSON_HEADERS,
    },
  });
}

export function balance({
  portfolio_id,
  ts,
}) {
  const url = new URL("/en/api/portfolio-tx/balance", window.location.origin);
  url.searchParams.set("portfolio_id", portfolio_id);
  url.searchParams.set("ts", ts);
  return fetch(url, {
    method: "GET",
    headers: {
      ...JSON_HEADERS,
    },
  });
}

export function addTransaction({
  type,
  quantity,
  price_in_quote,
  portfolio_id,
  base_asset_type,
  base_asset_id,
  quote_asset_type,
  quote_asset_id,
  tx_at,
  related,
}) {
  return fetch(`/en/api/portfolio-tx`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
    },
    body: JSON.stringify({
      type,
      quantity,
      price_in_quote,
      portfolio_id,
      base_asset_type,
      base_asset_id,
      quote_asset_type,
      quote_asset_id,
      tx_at,
      related,
    }),
  });
}

export function updateTransaction({
  id,
  quantity,
  price_in_quote,
  quote_coin_id,
  tx_at,
  related,
}) {
  return fetch(`/en/api/portfolio-tx/${id}`, {
    method: "PUT",
    headers: {
      ...JSON_HEADERS,
    },
    body: JSON.stringify({
      quantity,
      price_in_quote,
      quote_coin_id,
      tx_at,
      related,
    }),
  });
}

export function deleteTransaction({ id, deleteRelatedTx = false }) {
  return fetch(`/en/api/portfolio-tx/${id}?delete_related_tx=${+deleteRelatedTx}`, {
    method: "DELETE",
    headers: {
      ...JSON_HEADERS,
    },
  });
}
