import http from 'k6/http';

export default function () {
    http.get('https://saarthi-zykh.onrender.com/health');
}