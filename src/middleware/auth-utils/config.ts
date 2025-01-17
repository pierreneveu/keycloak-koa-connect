/**
 * 读取配置文件
 * Created by zhangsong on 2018/8/9.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Construct a configuration object.
 * A configuration object may be constructed with either
 * a path to a `keycloak.json` file (which defaults to
 * `$PWD/keycloak.json` if not present, or with a configuration
 * object akin to what parsing `keycloak.json` provides.
 * @param {String|Object} config Configuration path or details.
 * @constructor
 */
class Config {
  public realm: string;
  public clientId: string;
  public secret: any;
  public public: any;
  public authServerUrl: string;
  public realmUrl: string;
  public realmAdminUrl: string;
  public minTimeBetweenJwksRequests: any;
  public bearerOnly: any;
  public publicKey: string;
  public scope: string;

  constructor(config: string | object) {
    if (!config) {
      config = path.join(process.cwd(), 'keycloak.json');
    }
    if (typeof config === 'string') {
      this.loadConfiguration(config);
    } else {
      this.configure(config);
    }
  }

  /**
   * 根据路径加载配置文件
   * @param {String} configPath Path to a `keycloak.json` configuration.
   */
  public loadConfiguration(configPath: string | number | Buffer | import ('url').URL) {
    const json = fs.readFileSync(configPath);
    const config = JSON.parse(json.toString());
    this.configure(config);
  }

  /**
   * Configure this `Config` object.
   *
   * This will set the internal configuration details.  The details
   * may come from a `keycloak.json` formatted object (with names such
   * as `auth-server-url`) or from an existing `Config` object (using
   * names such as `authServerUrl`).
   *
   * @param {Object} config The configuration to instill.
   */
  public configure(config: any) {
    /**
     * Tries to resolve environment variables in the given value in case it is of type "string",
     * else the given value is returned.
     * Environment variable references look like: '${env.MY_ENVIRONMENT_VARIABLE}',
     * optionally one can configure a fallback
     * if the referenced env variable is not present. E.g.
     * '${env.NOT_SET:http://localhost:8080}' yields 'http://localhost:8080'.
     * @param value
     */
    function resolveValue(value: string): any {
      if (typeof value !== 'string') {
        return value;
      }

      // "${env.MY_ENVIRONMENT_VARIABLE:http://localhost:8080}"
      // .replace(/\$\{env\.([^:]*):?(.*)?\}/,"$1--split--$2").split("--split--")
      const regex = /\$\{env\.([^:]*):?(.*)?\}/;

      // is this an environment variable reference with potential fallback?
      if (!regex.test(value)) {
        return value;
      }

      const tokens = value.replace(regex, '$1--split--$2').split('--split--');
      const envVar = tokens[0];
      const envVal = process.env[envVar];
      const fallbackVal = tokens[1];

      return envVal || fallbackVal;
    }

    /**
     * Realm ID
     * @type {String}
     */
    this.realm = resolveValue(config.realm);

    /**
     * Client/Application ID
     * @type {String}
     */
    this.clientId = resolveValue(config.resource || config['client-id'] || config.clientId);

    /**
     * Client/Application secret
     * @type {String}
     */
    this.secret = resolveValue((config.credentials || {}).secret || config.secret);

    /**
     * If this is a public application or confidential.
     * @type {String}
     */
    this.public = resolveValue(config['public-client'] || config.public || false);

    /**
     * Authentication server URL
     * @type {String}
     */
    this.authServerUrl = resolveValue(
      config['auth-server-url'] || config['server-url'] || config.serverUrl || config.authServerUrl,
    );

    /**
     * Root realm URL.
     * @type {String}
     */
    this.realmUrl = this.authServerUrl + '/realms/' + this.realm;

    /**
     * Root realm admin URL.
     * @type {String}
     */
    this.realmAdminUrl = this.authServerUrl + '/admin/realms/' + this.realm;

    /**
     * How many minutes before retrying getting the keys.
     * @type {Integer}
     */
    this.minTimeBetweenJwksRequests =
      config['min-time-between-jwks-requests'] || config.minTimeBetweenJwksRequests || 10;

    /**
     * If this is a Bearer Only application.
     * @type {Boolean}
     */
    this.bearerOnly = resolveValue(config['bearer-only'] || config.bearerOnly || false);

    /**
     * Formatted public-key.
     * @type {String}
     */
    const plainKey = resolveValue(config['realm-public-key'] || config.realmPublicKey);

    if (plainKey) {
      this.publicKey = '-----BEGIN PUBLIC KEY-----\n';
      for (let i = 0; i < plainKey.length; i = i + 64) {
        this.publicKey += plainKey.substring(i, i + 64);
        this.publicKey += '\n';
      }
      this.publicKey += '-----END PUBLIC KEY-----\n';
    }
  }
}

export default Config;
