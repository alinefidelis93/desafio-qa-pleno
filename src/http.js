'use strict';

const fs = require('fs');
const path = require('path');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

function json(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let bruto = '';
    req.on('data', (parte) => { bruto += parte; });
    req.on('end', () => {
      if (!bruto) return resolve({});
      try {
        resolve(JSON.parse(bruto));
      } catch {
        const erro = new Error('Corpo da requisição não é um JSON válido');
        erro.status = 400;
        reject(erro);
      }
    });
    req.on('error', reject);
  });
}

function arquivo(res, caminho) {
  fs.readFile(caminho, (erro, conteudo) => {
    if (erro) return json(res, 404, { erro: 'Arquivo não encontrado' });
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(caminho)] || 'application/octet-stream' });
    res.end(conteudo);
  });
}

function erro422(mensagem) {
  const erro = new Error(mensagem);
  erro.status = 422;
  return erro;
}

module.exports = { json, lerCorpo, arquivo, erro422 };
