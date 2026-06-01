import bcrypt from 'bcryptjs';

export default async (req) => {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, msg: '请填写完整信息' }), { status: 400 });
    }

    // 检查用户名是否存在
    const checkRes = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:${username}`, {
      headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
    });
    const checkData = await checkRes.json();
    if (checkData.result) {
      return new Response(JSON.stringify({ success: false, msg: '用户名已存在' }), { status: 400 });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      phone: '',
      email: '',
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/user:${username}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(user))
    });

    return new Response(JSON.stringify({ success: true, msg: '注册成功' }));
  } catch (err) {
    return new Response(JSON.stringify({ success: false, msg: '服务器错误' }), { status: 500 });
  }
};
