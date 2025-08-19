This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
# AI Agent Frontend (Next.js)

Este repositorio contiene el frontend (en Next.js 13) para la aplicación de agente AI que analiza documentos.  
El backend correspondiente está disponible aquí: [rag-agent backend](https://github.com/crcordova/rag-agent)

---

## ✅ Requisitos

- Node.js 18 o superior
- npm o yarn
- Backend corriendo localmente (o en servidor) basado en FastAPI

---
## Getting Started

Instal dependencias

```bash
npm install
```
Crea un archivo `.env.local` en la raíz del proyecto con esta variable:
```bash
NEXT_PUBLIC_URL_API=http://localhost:8000
```
Asegúrate de que este URL apunte al backend FastAPI correspondiente.

Modo desarrollo
```bash
npm run dev
```

Build de Producción
```bash
npm run build
```
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
