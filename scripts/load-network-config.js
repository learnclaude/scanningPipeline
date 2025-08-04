#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class NetworkConfigLoader {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(__dirname, '../config/network-config.json');
    this.config = null;
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load network configuration: ${error.message}`);
    }
  }

  getEnvironmentConfig(environment) {
    if (!this.config) {
      this.loadConfig();
    }

    if (!this.config.environments[environment]) {
      throw new Error(`Environment '${environment}' not found in configuration`);
    }

    return this.config.environments[environment];
  }

  getServiceIP(environment, serviceName) {
    const envConfig = this.getEnvironmentConfig(environment);
    
    if (!envConfig.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found in ${environment} environment`);
    }

    return envConfig.services[serviceName];
  }

  generateDockerComposeNetworkConfig(environment) {
    const envConfig = this.getEnvironmentConfig(environment);
    
    return {
      networks: {
        [`${environment}-network`]: {
          driver: 'bridge',
          internal: this.config.security.internal_only,
          ipam: {
            config: [{
              subnet: envConfig.subnet,
              gateway: envConfig.gateway
            }]
          }
        }
      }
    };
  }

  generateServiceNetworkConfig(environment, serviceName) {
    const serviceIP = this.getServiceIP(environment, serviceName);
    
    return {
      networks: {
        [`${environment}-network`]: {
          ipv4_address: serviceIP
        }
      }
    };
  }

  validateConfiguration() {
    if (!this.config) {
      this.loadConfig();
    }

    const errors = [];
    
    // Validate required fields
    if (!this.config.environments) {
      errors.push('Missing environments configuration');
      return errors;
    }

    // Validate each environment
    Object.entries(this.config.environments).forEach(([envName, envConfig]) => {
      if (!envConfig.subnet) {
        errors.push(`Missing subnet for environment: ${envName}`);
      }
      if (!envConfig.gateway) {
        errors.push(`Missing gateway for environment: ${envName}`);
      }
      if (!envConfig.services || Object.keys(envConfig.services).length === 0) {
        errors.push(`Missing services configuration for environment: ${envName}`);
      }
    });

    return errors;
  }
}

// CLI usage
if (require.main === module) {
  const loader = new NetworkConfigLoader();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node load-network-config.js <command> [args...]');
    console.log('Commands:');
    console.log('  validate                           - Validate configuration');
    console.log('  get-env <environment>              - Get environment config');
    console.log('  get-service-ip <env> <service>     - Get service IP');
    console.log('  generate-network <environment>     - Generate Docker network config');
    process.exit(1);
  }

  try {
    const command = args[0];
    
    switch (command) {
      case 'validate':
        const errors = loader.validateConfiguration();
        if (errors.length === 0) {
          console.log('✅ Configuration is valid');
        } else {
          console.error('❌ Configuration errors:');
          errors.forEach(error => console.error(`  - ${error}`));
          process.exit(1);
        }
        break;
        
      case 'get-env':
        if (args.length < 2) {
          console.error('Usage: get-env <environment>');
          process.exit(1);
        }
        console.log(JSON.stringify(loader.getEnvironmentConfig(args[1]), null, 2));
        break;
        
      case 'get-service-ip':
        if (args.length < 3) {
          console.error('Usage: get-service-ip <environment> <service>');
          process.exit(1);
        }
        console.log(loader.getServiceIP(args[1], args[2]));
        break;
        
      case 'generate-network':
        if (args.length < 2) {
          console.error('Usage: generate-network <environment>');
          process.exit(1);
        }
        console.log(JSON.stringify(loader.generateDockerComposeNetworkConfig(args[1]), null, 2));
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = NetworkConfigLoader;