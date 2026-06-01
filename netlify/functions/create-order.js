export default async (req) => {
  try {
    const { username, items, total, receiver } = await req.json();
    
    if (!username || !items || !total || !receiver) {
      return new Response(JSON.stringify({ success: false, msg: '参数错误' }), { status: 400 });
    }

    const order = {
      id: Date.now().toString(),
      username,
      items,
      total,
      receiver,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 保存订单
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/order:${order.id}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(order))
    });

    // 添加到用户订单列表
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/lpush/user:${username}:orders/${order.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });

    return new Response(JSON.stringify({ success: true, orderId: order.id }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
