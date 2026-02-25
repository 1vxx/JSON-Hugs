export type LanguageType = 'typescript' | 'kotlin' | 'java';

function capitalize(str: string) {
  if (!str) return 'AnyData';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getObjectEntries(obj: Record<string, unknown>) {
  return Object.entries(obj);
}

/**
 * Common logic to traverse JSON and build type dependencies 
 */
function extractEntities(json: unknown, rootName: string) {
  const entities: { name: string, fields: { [key: string]: string }, list: boolean }[] = [];
  const entityNames = new Set<string>();

  function parseType(value: unknown, keyName: string): string {
    if (value === null) return 'null';
    
    const type = typeof value;
    if (type === 'string') return 'string';
    if (type === 'number') return 'number';
    if (type === 'boolean') return 'boolean';

    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const itemType = parseType(value[0], keyName + 'Item');
      return `${itemType}[]`; // suffix with [] to denote array
    }

    if (type === 'object') {
      const entityName = capitalize(keyName);
      
      let uniqueName = entityName;
      let counter = 1;
      while (entityNames.has(uniqueName)) {
         uniqueName = `${entityName}${counter++}`;
      }
      entityNames.add(uniqueName);

      const obj = value as Record<string, unknown>;
      const fields: { [key: string]: string } = {};
      
      for (const [k, v] of getObjectEntries(obj)) {
        fields[k] = parseType(v, k);
      }
      
      entities.push({ name: uniqueName, fields, list: false });
      return uniqueName;
    }
    return 'any';
  }

  parseType(json, rootName);
  return entities;
}

export function generateCode(json: unknown, rootName: string = 'Root', lang: LanguageType = 'typescript'): string {
  if (json === null || json === undefined) {
    if (lang === 'typescript') return `export type ${rootName} = null | undefined;`;
    if (lang === 'kotlin') return `// Data is null`;
    if (lang === 'java') return `// Data is null`;
    return '';
  }

  if (typeof json !== 'object' || Array.isArray(json)) {
    // Only handle direct object maps properly; for arrays/primitives, wrap them.
    json = { data: json };
  }

  const entities = extractEntities(json, rootName);
  const blocks: string[] = [];

  for (const entity of entities) {
    if (lang === 'typescript') {
      let block = `export interface ${entity.name} {\n`;
      for (const [k, v] of Object.entries(entity.fields)) {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
        // map types
        let typeStr = v;
        if (v === 'null') typeStr = 'any /* null */';
        else if (v.includes('[]')) {
          const baseStr = v.replace('[]', '');
          typeStr = baseStr === 'null' ? 'any[]' : v;
        }
        block += `  ${safeKey}: ${typeStr};\n`;
      }
      block += `}`;
      blocks.push(block);
    } 
    else if (lang === 'kotlin') {
      let block = `data class ${entity.name}(\n`;
      const fields = Object.entries(entity.fields);
      for (let i = 0; i < fields.length; i++) {
        const [k, v] = fields[i];
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `\`${k}\``;
        let pType = 'Any?';
        if (v === 'string') pType = 'String?';
        else if (v === 'number') pType = 'Double?'; // use double for generic number
        else if (v === 'boolean') pType = 'Boolean?';
        else if (v.endsWith('[]')) {
          const base = v.replace('[]', '');
          let listType = 'Any';
          if (base === 'string') listType = 'String';
          else if (base === 'number') listType = 'Double';
          else if (base === 'boolean') listType = 'Boolean';
          else if (base !== 'any' && base !== 'null') listType = base;
          pType = `List<${listType}>?`;
        } else if (v !== 'any' && v !== 'null') {
          pType = `${v}?`;
        }
        block += `    val ${safeKey}: ${pType} = null${i < fields.length - 1 ? ',' : ''}\n`;
      }
      block += `)`;
      blocks.push(block);
    }
    else if (lang === 'java') {
      let block = `@Data\npublic class ${entity.name} {\n`;
      for (const [k, v] of Object.entries(entity.fields)) {
        let safeKey = k.replace(/[^a-zA-Z0-9_$]/g, '_');
        if (/^[0-9]/.test(safeKey)) safeKey = 'n_' + safeKey;
        
        let pType = 'Object';
        if (v === 'string') pType = 'String';
        else if (v === 'number') pType = 'Double'; 
        else if (v === 'boolean') pType = 'Boolean';
        else if (v.endsWith('[]')) {
          const base = v.replace('[]', '');
          let listType = 'Object';
          if (base === 'string') listType = 'String';
          else if (base === 'number') listType = 'Double';
          else if (base === 'boolean') listType = 'Boolean';
          else if (base !== 'any' && base !== 'null') listType = base;
          pType = `List<${listType}>`;
        } else if (v !== 'any' && v !== 'null') {
          pType = v;
        }
        block += `    private ${pType} ${safeKey};\n`;
      }
      block += `}`;
      blocks.push(block);
    }
  }

  let finalRes = blocks.reverse().join('\n\n');
  if (lang === 'java') {
     let imports = `import lombok.Data;\n`;
     if (finalRes.includes('List<')) imports += `import java.util.List;\n`;
     finalRes = imports + `\n` + finalRes;
  }
  return finalRes;
}
