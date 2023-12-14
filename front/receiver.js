import vars from './vars.js';

async function receiveData() {
    const response = await fetch(vars.backendUrl);
    const jsonResp =  await response.json();
    return jsonResp.map(item => {
        const gps = item.gps['coordinates']
        return {
            name: item.name,
            lat: gps[0],
            lon: gps[1],
            description: item.description
        }
    })
}

export default receiveData;
