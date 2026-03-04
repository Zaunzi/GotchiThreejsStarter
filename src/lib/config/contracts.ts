import { BASE_MAINNET_ID, BASE_SEPOLIA_ID } from './chains';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Example contract addresses - replace with your actual contracts
  EXAMPLE_CONTRACT: {
    [BASE_SEPOLIA_ID]: '0x0000000000000000000000000000000000000000', // Base Sepolia
    [BASE_MAINNET_ID]: '0x0000000000000000000000000000000000000000' // Base Mainnet
  },
  // Aavegotchi Diamond Contract (Base mainnet)
  AAVEGOTCHI: {
    [BASE_MAINNET_ID]: '0xa99c4b08201f2913db8d28e71d020c4298f29dbf'
  }
} as const;

// Common contract ABIs
export const COMMON_ABIS = {
  // ERC-20 Token ABI
  ERC20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],

  // ERC-721 NFT ABI
  ERC721: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function setApprovalForAll(address operator, bool approved)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
  ],
  // AavegotchiFacet ABI - key functions for fetching gotchi data
  AAVEGOTCHI: [
    'function getAavegotchi(uint256 _tokenId) view returns (tuple(uint256 tokenId, string name, address owner, uint256 randomNumber, uint256 status, int16[6] numericTraits, int16[6] modifiedNumericTraits, uint16[16] equippedWearables, address collateral, address escrow, uint256 stakedAmount, uint256 minimumStake, uint256 kinship, uint256 lastInteracted, uint256 experience, uint256 toNextLevel, uint256 usedSkillPoints, uint256 level, uint256 hauntId, uint256 baseRarityScore, uint256 modifiedRarityScore, bool locked, tuple(uint256 balance, uint256 itemId, tuple(string name, string description, string author, int8[6] traitModifiers, bool[16] slotPositions, uint8[] allowedCollaterals, tuple(uint8 x, uint8 y, uint8 width, uint8 height) dimensions, uint256 ghstPrice, uint256 maxQuantity, uint256 totalQuantity, uint32 svgId, uint8 rarityScoreModifier, bool canPurchaseWithGhst, uint16 minLevel, bool canBeTransferred, uint8 category, int16 kinshipBonus, uint32 experienceBonus) itemType)[] items))',
    'function tokenIdsOfOwner(address _owner) view returns (uint32[] tokenIds)'
  ]
} as const;

// Helper function to get contract address for current network
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES, chainId: number): string {
  const contract = CONTRACT_ADDRESSES[contractName];
  if (!contract) {
    throw new Error(`Contract ${contractName} not found`);
  }
  
  const address = contract[chainId as keyof typeof contract];
  if (!address) {
    throw new Error(`Contract ${contractName} not deployed on chain ${chainId}`);
  }
  
  return address;
}

// Helper function to check if contract is deployed on current network
export function isContractDeployed(contractName: keyof typeof CONTRACT_ADDRESSES, chainId: number): boolean {
  try {
    getContractAddress(contractName, chainId);
    return true;
  } catch {
    return false;
  }
}
