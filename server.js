/* eslint-disable default-case */
const favicon         = require( "express-favicon" );
const bodyParser      = require( "body-parser" );
const nodemailer      = require( "nodemailer" );
const express         = require( "express" );
const { MongoClient } = require( "mongodb" );
const http            = require( "http" );
const path            = require( "path" );

function createEmptyResponseData() {
    // * Создаёт базовый объект ответа на запрос
    return {
        report: {
            isError: true,
            info: ""
        },
        reply: {}
    };
}

function isAllValuesNonEmptyStrings( body ) {
    // * Проверяет все ли значения в body являются строками, при том что body непустой обьект
    let result = 1;
    for ( const key in body ) {
        result &= +( typeof body[ key ] === "string" && !!body[ key ].length );
    }
    return !!result;
}


const port           = process.env.PORT            || 3000;
const mongoLink      = process.env.MONGODB_URI     || "mongodb://myUserAdmin:0000@localhost:27017/admin";
const collectionName = process.env.COLLECTION_NAME || "usersPhonesAndNumbers";
const mailLogin      = process.env.GMAIL_LOGIN     || "wHaTeVeR123@gmail.com";
const mailPassword   = process.env.GMAIL_PASS      || "wHaTeVeR123";

console.log( "mongoLink: ",      mongoLink      );
console.log( "port: ",           port           );
console.log( "collectionName: ", collectionName );
console.log( "mailLogin: ",      mailLogin      );
console.log( "mailPassword: ",   mailPassword   );


let transporter = nodemailer.createTransport( {
    service: "gmail",
    auth: {
        user: mailLogin,
        pass: mailPassword
    }
} );

const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.text() );
app.use( favicon( __dirname + "/build/favicon.ico" ) );

app.use( express.static( path.join( __dirname, "build" ) ) );
app.get( "/*", ( request, response ) => {
    response.sendFile( path.join( __dirname, "build", "index.html" ) );
});

app.post( "/addNewUser", async ( request, response ) => {
    const responseData = createEmptyResponseData();
    const { email, phone } = request.body;
    const userProfile = { email, phone };
    console.log( "userProfile: ", userProfile );

    if( !isAllValuesNonEmptyStrings( userProfile ) ) {
        responseData.report.isError = true;
        responseData.report.info = "Не все поля заполнены или неверный формат запроса";
        return response.json( responseData );
    }
    try {
        const { result } = await usersCollection.insertOne( userProfile );
        if ( !result.ok )
            throw new Error( "insertOne not ok" );
    } catch ( error ) {
        console.error( "app.post /addNewUser usersCollection.insertOne throws the error: ", error );
        responseData.report.info = "Произошла ошибка на сервере";
        return response.json( responseData );
    }
    responseData.report.isError = false;
    responseData.report.info = "Пользователь успешно создан.";
    response.json( responseData );
} );

app.post( "/restoreUserPhone", async ( request, response ) => {
    const responseData = createEmptyResponseData();
    const { email } = request.body;
    const query = { email };
    console.log("query: ", query);

    if( !isAllValuesNonEmptyStrings( query ) ) {
        responseData.report.info = "Не все поля заполнены или неверный формат запроса";
        return response.json( responseData );
    }
    try {
        let foundResult = await usersCollection.findOne( query );
        if ( !foundResult ) {
            responseData.report.info = "Пользователь с указанной почтой не найден";
            return response.json( responseData );
        }

        await transporter.sendMail( {
            from: `robot <${ mailLogin }>`,
            to: foundResult.email,
            subject: "Восстановление номера телефона",
            html: `
                <p>Это сообщение было вам отправлено, потому что вы недавно запрашивали восстановление номера телефона.</p>
                <p>Ваш номер телефона: <strong>${ foundResult.phone }</strong></p>
            `
        } );
    } catch ( error ) {
        console.error( "app.post /restoreUserPhone usersCollection.findOne throws the error: ", error );
        responseData.report.info = "Произошла ошибка на сервере";
        return response.json( responseData );
    }
    responseData.report.isError = false;
    responseData.report.info = "Письмо c телефонным номером было отправлено на указанную почту. Если письма нет во входящих, проверьте папку спам.";
    response.json( responseData );
} );



let dbClient;
let usersCollection;

const server = http.createServer(app);

const mongoClient = new MongoClient( mongoLink, {
    useNewUrlParser: true,
    useUnifiedTopology: true
} );

function shutdown() {
    let haveErrors = false;
    console.log( "Exiting...\n\nClosing MongoDb connection..." );
    if ( !dbClient ) {
        // так как сервер запускается ТОЛЬКО после того как произошло успешное подключение БД,
        // то можно с уверенностью сказать, что если dbClient пуст, то сервер точно не запущен
        console.log("MongoDb not started.\n\nClosing http server...\nHttp server not started.");
        return process.exit( 1 );
    }
    dbClient.close( false, err => {
        if ( err ) {
            console.error(err);
            haveErrors = true;
        }
        console.log( "MongoDb connection closed.\n\nClosing http server..." );
        if ( server.listening ) {
            console.log( "Http server not started.\n" );
            return process.exit( 1 );
        }
        server.close( err => {
            if ( err ) {
                console.log( err );
                haveErrors = true;
            }
            console.log( "Http server closed.\n" );
            process.exit( ~~haveErrors );
        } );
    } );
}

mongoClient.connect( ( error, client ) => {
    if ( error ) {
        console.error( error );
        return shutdown();
    }

    dbClient = client;
    usersCollection = client.db().collection( collectionName );
    server.listen( port, function() {
        console.log( "Сервер слушает" );
    } );
} );

process.on( "SIGTERM", shutdown );
process.on( "SIGINT", shutdown );
