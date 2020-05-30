const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body');
const morgan = require('koa-morgan')
const mongo = require('koa-mongo');
const fs = require('fs')
const dotenv = require("dotenv");
dotenv.config();



/* init instance */
const accessLogStream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' })
const app = new Koa();
const router = new Router();
const MY_PORT = process.env.PORT;







/* middle ware */
app.use(mongo({
    uri: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@test1-lisp6.mongodb.net/test?retryWrites=true&w=majority`,
    db: 'article_test',
}, {
    useUnifiedTopology: true
}));


app.use(morgan('combined', { stream: accessLogStream }));
app.use(koaBody());



app.use(async(ctx, next) => {
    console.log(`
                $ { ctx.request.method }
                $ { ctx.request.url }
                `); // 打印URL
    await next();
})

app.use(async(ctx, next) => {
    const start = new Date().getTime(); // 当前时间
    await next(); // 调用下一个middleware
    const ms = new Date().getTime() - start; // 耗费时间
    console.log(`
                Time: $ { ms }
                ms `); // 打印耗费时间
});




router
    .post('/article', async ctx => {
        const { title } = ctx.request.body;
        const { body } = ctx.request.body;
        const { author } = ctx.request.body;
        if (title && body && author) {
            const data = await ctx.db.collection('articles').insertOne({
                title,
                body,
                author,
                time: new Date(),
            });

            ctx.status = 201;
            ctx.body = data.insertedId;
        } else {
            ctx.status = 400;
        }
    })
    .put('/article/:id', async ctx => {
        const id = ctx.params.id;
        const { title } = ctx.request.body;
        const { body } = ctx.request.body;
        const { author } = ctx.request.body;
        if (title && body && author) {
            const article = await ctx.db.collection('articles').findOne({ _id: mongo.ObjectId(id) });
            if (article) {
                article.title = title;
                article.body = body;
                article.author = author;
                article.time = new Date();
                await ctx.db.collection('articles').updateOne({ _id: mongo.ObjectId(id) }, {
                    $set: {
                        title,
                        body,
                        author,
                        time: new Date(),
                    }
                });
                ctx.status = 204;
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 400;
        }
    })
    .get('/article/:id', async ctx => {
        const id = ctx.params.id;
        if (id) {
            const article = await ctx.db.collection('articles').findOne({ _id: mongo.ObjectId(id) });
            if (article) {
                ctx.body = article;
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 404;
        }
    })
    .delete('/article/:id', async ctx => {
        const id = ctx.params.id;
        if (id) {
            const article = await ctx.db.collection('articles').findOne({ _id: mongo.ObjectId(id) });

            if (article) {
                await ctx.db.collection('articles').remove({ _id: mongo.ObjectId(id) });
                ctx.status = 204;
            } else {
                ctx.status = 404;
            }
        } else {
            ctx.status = 404;
        }

    });
app.use(router.routes());





app.listen(MY_PORT, () => console.log(`app started at port ${MY_PORT}`));