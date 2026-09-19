import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modelo rápido con buena precisión leyendo documentos escaneados/fotografiados.
const MODELO = 'claude-haiku-4-5-20251001';

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp';

async function llamarConHerramienta(params: {
  imagenBase64: string;
  mediaType: MediaType;
  nombreHerramienta: string;
  descripcionHerramienta: string;
  schema: Record<string, unknown>;
  instrucciones: string;
}) {
  const respuesta = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 4096,
    tools: [
      {
        name: params.nombreHerramienta,
        description: params.descripcionHerramienta,
        input_schema: params.schema as Anthropic.Tool['input_schema'],
      },
    ],
    tool_choice: { type: 'tool', name: params.nombreHerramienta },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: params.mediaType, data: params.imagenBase64 },
          },
          { type: 'text', text: params.instrucciones },
        ],
      },
    ],
  });

  const bloqueHerramienta = respuesta.content.find((b) => b.type === 'tool_use');
  if (!bloqueHerramienta || bloqueHerramienta.type !== 'tool_use') {
    throw new Error('Claude no devolvió datos estructurados para este documento');
  }
  return bloqueHerramienta.input as Record<string, unknown>;
}

const LINEA_PRODUCTO_SCHEMA = {
  type: 'object',
  properties: {
    codigo: { type: ['string', 'null'], description: 'Código del producto tal como aparece en el documento' },
    descripcion: { type: 'string', description: 'Descripción o nombre del producto tal como aparece en el documento' },
    cantidad: { type: 'number' },
    unidad_medida: { type: ['string', 'null'], description: 'Ej: UND, KG, CAJA, BOLSA' },
    precio_unitario: { type: ['number', 'null'] },
    subtotal: { type: ['number', 'null'] },
  },
  required: ['descripcion', 'cantidad'],
};

export async function extraerFactura(imagenBase64: string, mediaType: MediaType) {
  const schema = {
    type: 'object',
    properties: {
      numero: { type: 'string', description: 'Número de factura, formato peruano ej. FT01-217884' },
      fecha_emision: { type: ['string', 'null'], description: 'Formato DD/MM/YYYY' },
      fecha_vencimiento: { type: ['string', 'null'], description: 'Formato DD/MM/YYYY' },
      proveedor_ruc: { type: ['string', 'null'], description: 'RUC de 11 dígitos del proveedor/emisor' },
      proveedor_razon_social: { type: ['string', 'null'] },
      cliente_ruc: { type: ['string', 'null'], description: 'RUC de 11 dígitos del cliente/receptor' },
      cliente_razon_social: { type: ['string', 'null'] },
      forma_pago: { type: ['string', 'null'], description: 'Ej: Contado, Crédito 30 días' },
      moneda: { type: 'string', enum: ['PEN', 'USD'], description: 'PEN si dice Soles o S/, USD si dice Dólares o $' },
      valor_venta: { type: ['number', 'null'], description: 'Subtotal antes de IGV' },
      igv: { type: ['number', 'null'] },
      importe_total: { type: ['number', 'null'] },
      sello_color: {
        type: 'string',
        enum: ['AZUL', 'ROJO', 'SIN_SELLO'],
        description:
          'Color del sello de goma estampado sobre el documento (no el color de impresión del logo o el diseño). AZUL si hay un sello azul, ROJO si hay un sello rojo, SIN_SELLO si no hay ningún sello visible.',
      },
      lineas: { type: 'array', items: LINEA_PRODUCTO_SCHEMA },
    },
    required: ['numero', 'moneda', 'sello_color', 'lineas'],
  };

  return llamarConHerramienta({
    imagenBase64,
    mediaType,
    nombreHerramienta: 'registrar_factura',
    descripcionHerramienta: 'Registra los datos extraídos de una factura peruana',
    schema,
    instrucciones:
      'Esta imagen es una factura de un proveedor peruano. Extrae todos los datos con precisión. ' +
      'Presta especial atención a si hay un sello de goma estampado (azul o rojo) sobre el documento: es distinto del color de impresión del papel o del logo del proveedor. ' +
      'Si un campo no aparece en el documento, usa null. No inventes datos.',
  });
}

export async function extraerNotaCredito(imagenBase64: string, mediaType: MediaType) {
  const schema = {
    type: 'object',
    properties: {
      numero: { type: 'string' },
      fecha_emision: { type: ['string', 'null'], description: 'Formato DD/MM/YYYY' },
      proveedor_ruc: { type: ['string', 'null'] },
      proveedor_razon_social: { type: ['string', 'null'] },
      factura_numero: { type: 'string', description: 'Número de la factura que esta nota de crédito rectifica' },
      motivo: { type: ['string', 'null'] },
      monto_total: { type: ['number', 'null'] },
      lineas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            codigo: { type: ['string', 'null'] },
            nombre: { type: 'string' },
            cantidad: { type: ['number', 'null'] },
            precio_unitario: { type: ['number', 'null'] },
            subtotal: { type: ['number', 'null'] },
          },
          required: ['nombre'],
        },
      },
    },
    required: ['numero', 'factura_numero', 'lineas'],
  };

  return llamarConHerramienta({
    imagenBase64,
    mediaType,
    nombreHerramienta: 'registrar_nota_credito',
    descripcionHerramienta: 'Registra los datos extraídos de una nota de crédito peruana',
    schema,
    instrucciones:
      'Esta imagen es una nota de crédito de un proveedor peruano. Extrae todos los datos con precisión, ' +
      'especialmente el número de la factura que rectifica (suele decir "referencia" o "factura relacionada"). ' +
      'El código y nombre de cada producto en esta nota son los valores de referencia interna. Si un campo no aparece, usa null.',
  });
}

export async function extraerOrdenCompra(imagenBase64: string, mediaType: MediaType) {
  const schema = {
    type: 'object',
    properties: {
      numero: { type: 'string' },
      fecha: { type: ['string', 'null'], description: 'Formato DD/MM/YYYY' },
      proveedor_ruc: { type: ['string', 'null'] },
      proveedor_razon_social: { type: ['string', 'null'] },
      monto_total: { type: ['number', 'null'] },
      lineas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            codigo: { type: ['string', 'null'] },
            descripcion: { type: 'string' },
            cantidad: { type: ['number', 'null'] },
            precio_unitario: { type: ['number', 'null'] },
            subtotal: { type: ['number', 'null'] },
          },
          required: ['descripcion'],
        },
      },
    },
    required: ['numero', 'lineas'],
  };

  return llamarConHerramienta({
    imagenBase64,
    mediaType,
    nombreHerramienta: 'registrar_orden_compra',
    descripcionHerramienta: 'Registra los datos extraídos de una orden de compra peruana',
    schema,
    instrucciones:
      'Esta imagen es una orden de compra peruana. Extrae todos los datos con precisión. Si un campo no aparece, usa null.',
  });
}
