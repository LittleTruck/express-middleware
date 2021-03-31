const express = require('express')
const redis = require('redis')
const app = express()
const port = 3000

app.get('/', async(req, res) => {
    const redisClient = redis.createClient({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST
    })
    const ipAddress = getClientIp(req);

    await redisClient
        .multi()
        .set([ipAddress, 0, 'EX', 3600, 'NX'])
        .incr(ipAddress)
        .ttl(ipAddress)
        .exec((err, replies) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            const requestCount = replies[1];

            res.append('X-RateLimit-Remaining', 1000 - requestCount);
            res.append('X-RateLimit-Reset', Math.floor(replies[2]/60) + ':' +replies[2]%60);

            if (requestCount > 1000) {
                return res.status(429).send('你抽太多了！')
            }

            res.send('Dcard Backend Intern Work');
        })

})

const getClientIp = function (req) {
    const ipInfo = req.socket.address();
    let ipAddress = ipInfo.address;
    if (!ipAddress) {
        return '';
    }

    if (ipAddress.substr(0, 7) == "::ffff:") {
        ipAddress = ipAddress.substr(7)
    }
    return ipAddress;
};

app.listen(port, () => {
    console.log(`app is running at ${port}`);
})