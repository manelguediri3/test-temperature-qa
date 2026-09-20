function fn() {
  var env = karate.env || 'local';
  karate.log('karate.env =', env);

  var config = {
    env: env,
    baseUrl: karate.properties['baseUrl'] || 'http://localhost:3000'
  };

  karate.configure('connectTimeout', 10000);
  karate.configure('readTimeout', 10000);

  return config;
}
