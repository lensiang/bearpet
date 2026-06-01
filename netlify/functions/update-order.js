export default async (req) => {
  try {
    const { orderId, status, adminUsername } = await req.json();
    
    // 验证管理员权限
    if (adminUsername !== 'admin') {
      return new Response(JSON.stringify({ success: false, msg: '无权限' }), { status: 403 });
    }

    const orderRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/order:${orderId}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const orderData = await orderRes.json();
    if (!orderData.result) {
      return new Response(JSON.stringify({ success: false, msg: '订单不存在' }), { status: 400 });
    }

    const order = JSON.parse(orderData.result);
    order.status = status;

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/order:${orderId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(order))
    });

    return new Response(JSON.stringify({ success: true, msg: '订单状态更新成功' }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
