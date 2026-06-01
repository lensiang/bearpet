import bcrypt from 'bcryptjs';

export default async (req) => {
  try {
    const { username, oldPassword, newPassword } = await req.json();
    
    const userRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${username}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const userData = await userRes.json();
    if (!userData.result) {
      return new Response(JSON.stringify({ success: false, msg: '用户不存在' }), { status: 400 });
    }

    const user = JSON.parse(userData.result);
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ success: false, msg: '原密码错误' }), { status: 400 });
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

    return new Response(JSON.stringify({ success: true, msg: '密码修改成功' }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
