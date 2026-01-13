import { safeAwaitAxios } from './src/adapters/axios.ts';
import { safeAwaitUndici } from './src/adapters/undici.ts';

async function fetchData(userId: string) {
    const [error, data, status] = await safeAwaitAxios(
        fetch(`https://jsonplaceholder.typicode.com/todos/${userId}`).then(
            (res) => res.json()
        )
    );

    console.log('Status', status);
    console.log('Data', data);
    console.log('Error', error);

    if (error) {
        console.error('Request failed', status, error);
        return null;
    }

    return data;
}

const res = await fetchData('5');
