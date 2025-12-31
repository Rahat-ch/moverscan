const RPC_URL = 'https://mainnet.movementnetwork.xyz/v1'

export interface ModuleABI {
  address: string
  name: string
  friends: string[]
  exposed_functions: ExposedFunction[]
  structs: StructDef[]
}

export interface ExposedFunction {
  name: string
  visibility: string
  is_entry: boolean
  is_view: boolean
  generic_type_params: GenericTypeParam[]
  params: string[]
  return: string[]
}

export interface GenericTypeParam {
  constraints: string[]
}

export interface StructDef {
  name: string
  is_native: boolean
  abilities: string[]
  generic_type_params: GenericTypeParam[]
  fields: StructField[]
}

export interface StructField {
  name: string
  type: string
}

export async function getAccountModules(address: string): Promise<ModuleABI[]> {
  const response = await fetch(`${RPC_URL}/accounts/${address}/modules`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    if (response.status === 404) return []
    throw new Error(`Failed to fetch modules: ${response.status}`)
  }

  const modules = await response.json()
  return modules.map((mod: { abi: ModuleABI }) => mod.abi)
}

export async function getAccountResources(address: string): Promise<unknown[]> {
  const response = await fetch(`${RPC_URL}/accounts/${address}/resources`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    if (response.status === 404) return []
    throw new Error(`Failed to fetch resources: ${response.status}`)
  }

  return response.json()
}

export interface ViewRequest {
  function: string
  type_arguments: string[]
  arguments: string[]
}

export async function viewFunction(request: ViewRequest): Promise<unknown[]> {
  const response = await fetch(`${RPC_URL}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`View function failed: ${error}`)
  }

  return response.json()
}
