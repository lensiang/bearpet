import bcrypt from 'bcryptjs';

export default async (req) => {
  try {
    const { username, phone, newPassword } = await req.json();
    
    const userRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${username}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const userData = await userRes.json();
    if (!userData.result) {
      return new Response(JSON.stringify({ success: false, msg: '用户名不存在' }), { status: 400 });
    }

    const user = JSON.parse(userData.result);
    if (user.phone !== phone) {
      return new Response(JSON.stringify({ success: false, msg: '绑定手机号不匹配' }), { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/user:${username}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(user))
    });

    return new Response(JSON.stringify({ success: true, msg: '密码重置成功' }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
