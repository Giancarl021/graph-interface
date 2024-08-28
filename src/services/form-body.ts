interface FormData {
    [key: string]: string;
}

function formBody(data: FormData): string {
    const body: string[] = [];
    for (const key in data) {
        body.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
        );
    }

    return body.join('&');
}

export default formBody;
