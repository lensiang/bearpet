export default async (req) => {
  try {
    const { username, phone, email } = await req.json();
    
    const userRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${username}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const userData = await userRes.json();
    if (!userData.result) {
      return new Response(JSON.stringify({ success: false, msg: '用户不存在' }), { status: 400 });
    }

    const user = JSON.parse(userData.result);
    user.phone = phone || user.phone;
    user.email = email || user.email;

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/user:${username}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(user))
    });

    return new Response(JSON.stringify({ success: true, msg: '绑定信息保存成功' }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
