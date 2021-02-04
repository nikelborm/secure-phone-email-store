/* eslint-disable default-case */
const favicon         = require( "express-favicon" );
const bodyParser      = require( "body-parser" );
const nodemailer      = require( "nodemailer" );
const express         = require( "express" );
const { MongoClient } = require( "mongodb" );
const crypto          = require( "crypto" );
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

function createCert( secret, salt ) {
    const iv = crypto.randomBytes( 16 ); //генерация вектора инициализации
    const key = crypto.scryptSync( secret, salt, 32 ); //генерация ключа
    return iv.toString( "hex" ) + key.toString( "hex" );
}

function getKeyAndIVFromHexCertString( hexcert ) {
    const iv = Buffer.from( hexcert.slice( 0, 32 ), "hex" );
    const key = Buffer.from( hexcert.slice( 32 ), "hex" );
    return { key, iv };
}

function encrypt( text, key, iv ) {
    const cipher = crypto.createCipheriv( "aes-256-cbc", key, iv );
    const encryptedData = cipher.update( Buffer.from( text ) );
    return Buffer.concat( [ encryptedData, cipher.final() ] ).toString( "hex" );
}

function decrypt( encryptedData, key, iv ) {
    const decipher = crypto.createDecipheriv( "aes-256-cbc", key, iv );
    const decryptedData = decipher.update( encryptedData, "hex" );
    return Buffer.concat( [ decryptedData, decipher.final() ] ).toString();
}

const port           = process.env.PORT            || 3000;
const mongoLink      = process.env.MONGODB_URI     || "mongodb://myUserAdmin:0000@localhost:27017/admin";
const collectionName = process.env.COLLECTION_NAME || "usersPhonesAndNumbers";
const mailLogin      = process.env.GMAIL_LOGIN     || "wHaTeVeR123@gmail.com";
const mailPassword   = process.env.GMAIL_PASS      || "wHaTeVeR123";
// secret: tqoqTAKDKoF3a#QJp1xUS%i{?khDpWzVzCA*AgNJS#b@jba5Og#D#rJ5JhaDw*~n
// salt: MzTaulkux6#~P0|%DWX#ixqkX}IQv~Js@z0N~%f|N%ByFI}joflqz$$TQz%w%qZk
const hexcertificate = process.env.DB_CRYPT_SERT   || "a37bd28941991de94591b4c406608e1bb24620f332b6fb8c47bdd8509dee2b86f6cc182ce23e98b98492690ee330a540";

console.log( "mongoLink: ",      mongoLink      );
console.log( "port: ",           port           );
console.log( "collectionName: ", collectionName );
console.log( "mailLogin: ",      mailLogin      );
console.log( "mailPassword: ",   mailPassword   );
console.log( "hexcertificate: ", hexcertificate );


const transporter = nodemailer.createTransport( {
    service: "gmail",
    auth: {
        user: mailLogin,
        pass: mailPassword
    }
} );
const { key: dbCryptoKey, iv: dbCryptoIV } = getKeyAndIVFromHexCertString( hexcertificate );

const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.text() );
app.use( favicon( __dirname + "/build/favicon.ico" ) );

app.use( express.static( path.join( __dirname, "build" ) ) );
app.get( "/*", ( request, response ) => {
    response.sendFile( path.join( __dirname, "build", "index.html" ) );
} );

app.post( "/addNewUser", async ( request, response ) => {
    const responseData = createEmptyResponseData();
    const { email, phone } = request.body;

    if ( !isAllValuesNonEmptyStrings( { email, phone } ) ) {
        responseData.report.isError = true;
        responseData.report.info = "Не все поля заполнены или неверный формат запроса";
        return response.json( responseData );
    }
    const userProfile = {
        email: encrypt( email, dbCryptoKey, dbCryptoIV ),
        phone: encrypt( phone, dbCryptoKey, dbCryptoIV )
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

    if ( !isAllValuesNonEmptyStrings( { email } ) ) {
        responseData.report.info = "Не все поля заполнены или неверный формат запроса";
        return response.json( responseData );
    }
    const query = { email: encrypt( email, dbCryptoKey, dbCryptoIV ) };
    try {
        let foundResult = await usersCollection.findOne( query );
        if ( !foundResult ) {
            responseData.report.info = "Пользователь с указанной почтой не найден";
            return response.json( responseData );
        }

        await transporter.sendMail( {
            from: `robot <${ mailLogin }>`,
            to: email,
            subject: "Восстановление номера телефона",
            html: `
                <p>Это сообщение было вам отправлено, потому что вы недавно запрашивали восстановление номера телефона.</p>
                <p>Ваш номер телефона: <strong>${ decrypt( foundResult.phone, dbCryptoKey, dbCryptoIV ) }</strong></p>
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
