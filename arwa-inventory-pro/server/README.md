# Arwa Inventory Pro — Order Sync Backend

Real-time order sync server. Receives webhooks from Deliverect, Otter, DoorDash, and Uber Eats, then pushes live order updates to the React frontend via WebSocket.

## Quick Start

```bash
cd server
cp .env.example .env      # fill in your secrets
npm install
npm run dev               # development (nodemon auto-restart)
npm start                 # production
```

### Demo Mode (no aggregator needed)
Set `DEMO_MODE=true` in `.env` — the server injects a simulated order every 45–90 seconds so you can test the live sync without a real Deliverect/Otter account.

## Webhook URLs

Register these in your aggregator/platform dashboard:

| Platform | URL |
|----------|-----|
| Deliverect | `https://yourserver.com/webhooks/deliverect` |
| Otter | `https://yourserver.com/webhooks/otter` |
| DoorDash (direct) | `https://yourserver.com/webhooks/doordash` |
| Uber Eats (direct) | `https://yourserver.com/webhooks/ubereats` |

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get single order |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/orders/demo` | Inject a test order |
| DELETE | `/api/orders/:id` | Delete an order |
| GET | `/health` | Server health check |

## WebSocket Events

Connect: `ws://localhost:4000/ws?key=arwa_dev_key`

### Server → Client
| Event | Description |
|-------|-------------|
| `snapshot` | Full orders list sent on connect |
| `new_order` | New order received from any platform |
| `order_updated` | Order status changed |
| `order_deleted` | Order removed |

### Client → Server
| Event | Description |
|-------|-------------|
| `get_snapshot` | Request fresh order list |
| `update_status` | `{ orderId, status }` — advance order from client |

## Deployment

Deploy to any Node.js host. Recommended:
- **Railway** — `railway up` (free tier available)
- **Render** — connect GitHub repo, auto-deploy
- **DigitalOcean App Platform** — $5/mo

For production, replace the in-memory store (`store.js`) with MongoDB or PostgreSQL.
