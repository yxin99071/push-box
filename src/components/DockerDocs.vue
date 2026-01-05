<template>
  <div class="docs-container">
    <nav class="breadcrumb">Docs > Docker Engine > User Guide > Advanced Networking</nav>
    
    <header class="main-header">
      <h1>Advanced Container Networking Patterns</h1>
      <p class="lead">Deep dive into Libnetwork, CNM and multi-host networking configurations for production environments.</p>
    </header>

    <div class="docs-body">
      <section>
        <h2>1. The Container Network Model (CNM)</h2>
        <p>Docker’s networking stack is built on a set of interfaces called the Container Network Model (CNM). The CNM’s primary goal is to provide application portability across diverse network infrastructures...</p>
        <div class="info-callout">
          <strong>Note:</strong> In Docker 25.0+, the bridge driver remains the default for standalone containers.
        </div>
      </section>

      <section>
        <h2>2. Configuring Bridge Networks</h2>
        <p>To create a user-defined bridge network, use the <code>docker network create</code> command. This is recommended over the default bridge because it provides better isolation and DNS resolution.</p>
        <div class="code-header">Example: Multi-stage Build & Network setup</div>
        <pre class="code-block"><code># Create a network
$ docker network create --driver bridge isolated_nw

# Run a container with alias
$ docker run -d --network isolated_nw --network-alias search elasticsearch:8.10.0

# Verify the connection
$ docker exec -it client-app ping search</code></pre>
      </section>

      <section>
        <h2>3. Driver Comparison Table</h2>
        <table class="data-table">
          <thead>
            <tr><th>Driver</th><th>Scope</th><th>Use Case</th></tr>
          </thead>
          <tbody>
            <tr><td>Bridge</td><td>Local</td><td>Standard apps</td></tr>
            <tr><td>Overlay</td><td>Swarm</td><td>Multi-host clusters</td></tr>
            <tr><td>Macvlan</td><td>Local</td><td>Legacy direct-IP apps</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Performance Tuning & Security</h2>
        <p>Security is a critical aspect of Docker networking. By default, Docker containers can communicate with each other on the same network. However, you can implement fine-grained control using IPTables rules and Network Policies in higher-level orchestrators like Kubernetes. Furthermore, MTU settings should be optimized to avoid packet fragmentation in VXLAN tunnels...</p>
        <p>When deploying in the Japan (JP-East) region, ensure your <code>daemon.json</code> includes the correct mirror registry to avoid latency during <code>docker pull</code> operations. This is particularly important for high-concurrency CI/CD pipelines.</p>
      </section>

      <section>
        <h2>5. Docker Compose V2 Specification</h2>
        <pre class="code-block"><code>services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M</code></pre>
      </section>
    </div>
  </div>
</template>

<style scoped>
.docs-container { padding: 40px; color: #2c3e50; line-height: 1.8; max-width: 1000px; margin: 0 auto; text-align: left; }
.breadcrumb { font-size: 12px; color: #999; margin-bottom: 20px; }
.main-header { border-bottom: 1px solid #eee; margin-bottom: 30px; padding-bottom: 20px; }
.main-header h1 { font-size: 2.8rem; color: #2496ed; margin: 0; }
.lead { font-size: 1.2rem; color: #666; margin-top: 10px; }

h2 { font-size: 1.8rem; margin-top: 40px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px; }
p { margin: 15px 0; }
code { background: #fdf0f5; color: #eb144c; padding: 2px 4px; border-radius: 3px; font-family: monospace; }

.info-callout { background: #e7f3ff; border-left: 4px solid #2496ed; padding: 15px; margin: 20px 0; font-size: 0.95rem; }

.code-header { background: #333; color: #eee; padding: 5px 15px; font-size: 12px; border-radius: 5px 5px 0 0; margin-top: 20px; font-family: monospace; }
.code-block { background: #282c34; color: #abb2bf; padding: 20px; border-radius: 0 0 5px 5px; font-family: 'Consolas', monospace; overflow-x: auto; margin-bottom: 20px; }

.data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.data-table th, .data-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
.data-table th { background: #f8f9fa; }
</style>