async function loader(path, body) {
    let data;
    try {
        const response = await fetch(document.location.origin + path, {
            method: "post",
            body: JSON.stringify(body),
            headers: new Headers({
                "Content-Type": "application/json"
            })
        });
        if ( !response.ok ) {
            return {
                report: {
                    isError: true,
                    info: "Ошибка при отправке запроса на " + path + ": " + response.status + " - " + response.statusText
                }
            }
        }
        data = await response.json();
        console.log( "data: ", data );
    } catch ( error ) {
        console.error( error );
        return {
            report: {
                isError: true,
                info: "Ошибка при отправке запроса на " + path + ": " + error.name + " - " + error.message
            }
        };
    }
    return data;
}
export default loader;
