export default async (req) => {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('username');
    const getAll = url.searchParams.get('all') === 'true';

    let orders = [];

    if (getAll) {
      // 获取所有订单（管理员）
      const keysRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/keys/order:*`, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      const keysData = await keysRes.json();
      const keys = keysData.result || [];

      for (const key of keys) {
        const orderRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
          headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
        });
        const orderData = await orderRes.json();
        if (orderData.result) {
          orders.push(JSON.parse(orderData.result));
        }
      }
    } else {
      // 获取用户订单
      const orderIdsRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/lrange/user:${username}:orders/0/-1`, {
        headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
      });
      const orderIdsData = await orderIdsRes.json();
      const orderIds = orderIdsData.result || [];

      for (const orderId of orderIds) {
        const orderRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${orderId}`, {
          headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
        });
        const orderData = await orderRes.json();
        if (orderData.result) {
          orders.push(JSON.parse(orderData.result));
        }
      }
    }

    return new Response(JSON.stringify({ success: true, orders }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
