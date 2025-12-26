/**
 * Recommender Service Client
 * Cliente para interactuar con el servicio de recomendaciones ML
 */

const RECOMMENDER_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Obtiene recomendaciones generales de productos
 * @param {number} limit - Número máximo de productos a retornar
 * @param {string} category - Categoría opcional para filtrar
 * @returns {Promise<{products: Array, count: number, strategy: string}>}
 */
export async function getRecommendations(limit = 10, category = null) {
  try {
    const response = await fetch(`${RECOMMENDER_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit,
        ...(category && { category }),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Respuesta completa getRecommendations:', data);

    // Log solo de nombres de productos
    if (data.products && Array.isArray(data.products)) {
      console.log(
        `🎯 Productos randomizados por el modelo: ${data.products.length}`
      );
      if (data.products.length === 0) {
        console.warn('⚠️ La lista de productos está vacía');
      } else {
        data.products.forEach(product => {
          console.log(`   ${product.name}`);
        });
      }
    } else if (data.recommendations && Array.isArray(data.recommendations)) {
      console.log(`🎯 Productos recomendados: ${data.recommendations.length}`);
      if (data.recommendations.length === 0) {
        console.warn('⚠️ La lista de productos recomendados está vacía');
      } else {
        data.recommendations.forEach(product => {
          console.log(`   ${product.name}`);
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Backend Breaked');
    return null;
  }
}

/**
 * Obtiene productos similares a uno dado
 * @param {string} productId - ID del producto
 * @param {number} limit - Número máximo de productos a retornar
 * @returns {Promise<{similar_products: Array, count: number}>}
 */
export async function getSimilarProducts(productId, limit = 5) {
  try {
    const response = await fetch(
      `${RECOMMENDER_URL}/api/similar/${productId}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Respuesta completa getSimilarProducts:', data);

    if (data.similar_products && Array.isArray(data.similar_products)) {
      console.log(
        `🔗 Productos similares a ${productId}: ${data.similar_products.length}`
      );
      if (data.similar_products.length === 0) {
        console.warn('⚠️ La lista de productos similares está vacía');
      } else {
        data.similar_products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
        });
      }
    } else if (data.recommendations && Array.isArray(data.recommendations)) {
      console.log(
        `🔗 Productos similares a ${productId}: ${data.recommendations.length}`
      );
      if (data.recommendations.length === 0) {
        console.warn('⚠️ La lista de productos similares está vacía');
      } else {
        data.recommendations.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Backend Breaked');
    console.error('Error details:', error.message);
    return null;
  }
}

/**
 * Obtiene productos trending
 * @param {number} limit - Número máximo de productos a retornar
 * @returns {Promise<{trending_products: Array, count: number}>}
 */
export async function getTrendingProducts(limit = 10) {
  try {
    const response = await fetch(
      `${RECOMMENDER_URL}/api/trending?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG] Respuesta completa getTrendingProducts:', data);

    if (data.trending_products && Array.isArray(data.trending_products)) {
      console.log(`🔥 Productos trending: ${data.trending_products.length}`);
      if (data.trending_products.length === 0) {
        console.warn('⚠️ La lista de productos trending está vacía');
      } else {
        data.trending_products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
        });
      }
    } else if (data.recommendations && Array.isArray(data.recommendations)) {
      console.log(`🔥 Productos trending: ${data.recommendations.length}`);
      if (data.recommendations.length === 0) {
        console.warn('⚠️ La lista de productos trending está vacía');
      } else {
        data.recommendations.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Backend Breaked');
    console.error('Error details:', error.message);
    return null;
  }
}

/**
 * Obtiene recomendaciones personalizadas para un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número máximo de productos a retornar
 * @returns {Promise<{recommendations: Array, count: number}>}
 */
export async function getPersonalizedRecommendations(userId, limit = 10) {
  try {
    const response = await fetch(
      `${RECOMMENDER_URL}/api/personalized/${userId}?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      '[DEBUG] Respuesta completa getPersonalizedRecommendations:',
      data
    );

    if (data.recommendations && Array.isArray(data.recommendations)) {
      console.log(
        `👤 Recomendaciones personalizadas para usuario ${userId}: ${data.recommendations.length}`
      );
      if (data.recommendations.length === 0) {
        console.warn(
          '⚠️ La lista de recomendaciones personalizadas está vacía'
        );
      } else {
        data.recommendations.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name}`);
        });
      }
    }

    return data;
  } catch (error) {
    console.error('Backend Breaked');
    console.error('Error details:', error.message);
    return null;
  }
}

/**
 * Verifica el estado del servicio
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${RECOMMENDER_URL}/api/health`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Servicio de recomendaciones: ${data.status}`);
    return data;
  } catch (error) {
    console.error('Backend Breaked');
    console.error('Error details:', error.message);
    return null;
  }
}
