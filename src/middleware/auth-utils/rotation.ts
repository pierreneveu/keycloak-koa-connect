/**
 * Created by zhangsong on 2018/8/9.
 */
import * as http from 'http';
import * as https from 'https';
import * as jwkToPem from 'jwk-to-pem';
import { parse, UrlWithStringQuery } from 'url';
import Config from './config';

const getProtocol = (opts: http.ClientRequestArgs): { request: any } => {
  return opts.protocol === 'https:' ? https : http;
};

const nodeify = (promise: Promise<any>, cb: any) => {
  if (typeof cb !== 'function') {
    return promise;
  }
  return promise.then((res: any) => cb(null, res)).catch((err: any) => cb(err));
};

class Rotation {
  public realmUrl: string;
  public minTimeBetweenJwksRequests: number;
  public jwks: any[];
  public lastTimeRequestTime: number;

  constructor(config: Config) {
    this.realmUrl = config.realmUrl;
    this.minTimeBetweenJwksRequests = config.minTimeBetweenJwksRequests;
    this.jwks = [];
    this.lastTimeRequestTime = 0;
  }

  public retrieveJWKs(callback?: (params: any) => any) {
    const url = this.realmUrl + '/protocol/openid-connect/certs';
    const options: http.ClientRequestArgs & UrlWithStringQuery = parse(url);
    options.method = 'GET';

    const promise = new Promise((resolve, reject) => {
      const req = getProtocol(options).request(options, (response: { statusCode: number; on: any }) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject('Error fetching JWK Keys');
        }
        let json = '';
        response.on('data', (d: { toString: () => string }) => (json += d.toString()));
        response.on('end', () => {
          const data = JSON.parse(json);
          if (data.error) {
            reject(data);
          } else {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });
    return nodeify(promise, callback);
  }

  public getJWK(kid: any): any {
    const key = this.jwks.find((keys: { kid: any }) => {
      return keys.kid === kid;
    });
    if (key) {
      return new Promise((resolve, reject) => {
        resolve(jwkToPem(key));
      });
    }
    const self = this;
    // check if we are allowed to send request
    const currentTime = new Date().getTime() / 1000;
    if (currentTime > this.lastTimeRequestTime + this.minTimeBetweenJwksRequests) {
      return this.retrieveJWKs().then((publicKeys: { keys: any }) => {
        self.lastTimeRequestTime = currentTime;
        self.jwks = publicKeys.keys;
        return jwkToPem(
          self.jwks.find((keys: { kid: any }) => {
            return keys.kid === kid;
          }),
        );
      });
    } else {
      console.error('Not enough time elapsed since the last request, blocking the request');
    }
  }

  public clearCache() {
    this.jwks.length = 0;
  }
}

export default Rotation;
