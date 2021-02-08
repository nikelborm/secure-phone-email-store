const crypto          = require( "crypto" );
const hexcertificate = "a37bd28941991de94591b4c406608e1bb24620f332b6fb8c47bdd8509dee2b86f6cc182ce23e98b98492690ee330a540";


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
    return Buffer.concat( [
        cipher.update( Buffer.from( text ) ),
        cipher.final()
    ] ).toString( "hex" );
}

function decrypt( encryptedData, key, iv ) {
    const decipher = crypto.createDecipheriv( "aes-256-cbc", key, iv );
    return Buffer.concat( [
        decipher.update( encryptedData, "hex" ),
        decipher.final()
    ] ).toString();
}
const { key: dbCryptoKey, iv: dbCryptoIV } = getKeyAndIVFromHexCertString( hexcertificate );

const data = "sdf@.sdf/ergwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"
console.log('encrypt( data, dbCryptoKey, dbCryptoIV ): ', encrypt( data, dbCryptoKey, dbCryptoIV ));
console.log('decrypt( encrypt( data, dbCryptoKey, dbCryptoIV ), dbCryptoKey, dbCryptoIV ): ', decrypt( encrypt( data, dbCryptoKey, dbCryptoIV ), dbCryptoKey, dbCryptoIV ));
