import bcrypt from 'bcryptjs';

export default async (req) => {
  try {
    const { username, password } = await req.json();
    
    // 内置管理员账号
    if (username === 'admin' && password === '123456') {
      const adminUser = {
        id: 'admin001',
        username: 'admin',
        isAdmin: true
      };
      return new Response(JSON.stringify({ success: true, user: adminUser }));
    }

    // 普通用户登录
    const userRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${username}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const userData = await userRes.json();
    if (!userData.result) {
      return new Response(JSON.stringify({ success: false, msg: '用户名不存在' }), { status: 400 });
    }

    const user = JSON.parse(userData.result);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ success: false, msg: '密码错误' }), { status: 400 });
    }

    // 不返回密码给前端
    delete user.password;
    return new Response(JSON.stringify({ success: true, user }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
