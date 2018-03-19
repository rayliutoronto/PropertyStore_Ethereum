pragma solidity ^0.4.19;

/**
 * Property Store
 * @author Jiangsha Liu
 */
contract Properties {
    
    struct Property {
        // The creator of this property
        address creator;
        
        // Name of this property
        bytes32 name;
        
        // Long description of this property
        bytes32 desc;
        
        // ID of this property
        uint256 id;
        
        // The owner of the property
        address owner;
        
        // Current sale status
        bool selling;
        
        // Who is the selected buyer, if any.
        // Optional
        address sellingTo;
        
        // How much ether (wei) the seller has asked the buyer to send
        uint256 askingPrice;
    }
    
    // All properties listed
    Property[] private properties;
    
    // mapping between property index and id
    mapping(uint256=>uint256) private map;
    
    //
    // Modifiers
    // 
    
    // Makes functions require the called to be the owner of the contract
    modifier onlyOwner(uint256 _propertyId) {
        require(msg.sender == properties[map[_propertyId]].owner);
        _;
    }
    
    // Add to functions that the owner wants to prevent being called while the
    // contract is for sale.
    modifier ifNotLocked(uint256 _propertyId) {
        require(!properties[map[_propertyId]].selling);
        _;
    }
    
    event Transfer(uint256 _saleDate, address _from, address _to, uint256 _salePrice);

    /**
     * @param _name is name of property
     * @param _desc is long description of property
     * 
     * id (timestamp of creation for now) of registered property is returned
     */
    function register(bytes32 _name, bytes32 _desc) public returns (uint256) {
        uint256 _id = now;
        
        properties.push(Property({
            creator: msg.sender, 
            name: _name,
            desc: _desc,
            id: _id, 
            owner: msg.sender, 
            selling: false, 
            sellingTo: address(0),
            askingPrice: 0
        }));
        
        map[_id] = properties.length - 1;
        
        return _id;
    }
    
    /**
     * initiateSale is called by the owner of the property to start
     * the sale process.
     * @param _propertyId is id of property returned in function "register"
     * @param _price is the asking price for the sale
     * @param _to (OPTIONAL) is the address of the person that the owner
     * wants to sell the contract to. If set to 0x0, anyone can buy it.
     */
    function initiateSale(uint256 _propertyId, uint256 _price, address _to) onlyOwner(_propertyId) public {
        
        require(_to != address(this) && _to != properties[map[_propertyId]].owner);
        require(!properties[map[_propertyId]].selling);
        
        properties[map[_propertyId]].selling = true;
        
        // Set the target buyer, if specified.
        properties[map[_propertyId]].sellingTo = _to;
        
        properties[map[_propertyId]].askingPrice = _price;
    }
    
    /**
     * cancelSale allows the owner to cancel the sale before someone buys
     * the contract.
     */
    function cancelSale(uint256 _propertyId) onlyOwner(_propertyId) public {
        require(properties[map[_propertyId]].selling);
        
        // Reset sale variables
        resetSale(_propertyId);
    }
    
    /** 
     * @dev completeSale is called buy the specified buyer (or anyone if sellingTo)
     * was not set, to make the purchase.
     * Value sent must match the asking price.
     */
    function completeSale(uint256 _propertyId) public payable{
        require(properties[map[_propertyId]].selling);
        require(msg.sender != properties[map[_propertyId]].owner);
        require(msg.sender == properties[map[_propertyId]].sellingTo || properties[map[_propertyId]].sellingTo == address(0));
        require(msg.value == properties[map[_propertyId]].askingPrice);
        
        // Swap ownership
        address prevOwner = properties[map[_propertyId]].owner;
        address newOwner = msg.sender;
        uint256 salePrice = properties[map[_propertyId]].askingPrice;
        
        properties[map[_propertyId]].owner = newOwner;
        
        // Transaction cleanup
        resetSale(_propertyId);
        
        prevOwner.transfer(salePrice);
        
        Transfer(now,prevOwner,newOwner,salePrice);
    }
    
    /**
     * 
     * return all properties owned by msg.sender, including those created/registered by msg.sender.
     * 
     * 
     */
    function listAllMyProperties() public view returns(address[], bytes32[], bytes32[], uint256[], bool[], address[], uint256[]) {
        uint256 count = 0;
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].owner == msg.sender) {
                count++;
            }
        }
        
        address[] memory _creator = new address[](count);
        bytes32[] memory _name = new bytes32[](count);
        bytes32[] memory _desc = new bytes32[](count);
        uint256[] memory _id = new uint256[](count);
        bool[] memory _selling = new bool[](count);
        address[] memory _sellingTo = new address[](count);
        uint256[] memory _askingPrice = new uint256[](count);


        count = 0;
        for (i = 0; i < properties.length; i++) {
            if (properties[i].owner == msg.sender) {
                _creator[count] = properties[i].creator;
                _name[count] = properties[i].name;
                _desc[count] = properties[i].desc;
                _id[count] = properties[i].id;
                _selling[count] = properties[i].selling;
                _sellingTo[count] = properties[i].sellingTo;
                _askingPrice[count] = properties[i].askingPrice;

                
                count++;
            }
        }
        
        return (_creator, _name, _desc, _id, _selling, _sellingTo, _askingPrice);
    }

    /**
     * 
     * return all properties could be bought by msg.sender.
     * 
     * 
     */
    function listAllBuyableProperties() public view returns(address[], bytes32[], bytes32[], uint256[], address[], uint256[]){
        uint256 count = 0;
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].selling && properties[i].owner != msg.sender && (properties[i].sellingTo == address(0) || properties[i].sellingTo == msg.sender)) {
                count++;
            }
        }
        
        address[] memory _creator = new address[](count);
        bytes32[] memory _name = new bytes32[](count);
        bytes32[] memory _desc = new bytes32[](count);
        uint256[] memory _id = new uint256[](count);
        address[] memory _owner = new address[](count);
        uint256[] memory _askingPrice = new uint256[](count);
        
        count = 0;
        for (i = 0; i < properties.length; i++) {
            if (properties[i].selling && properties[i].owner != msg.sender && (properties[i].sellingTo == address(0) || properties[i].sellingTo == msg.sender)) {
                _creator[count] = properties[i].creator;
                _name[count] = properties[i].name;
                _desc[count] = properties[i].desc;
                _id[count] = properties[i].id;
                _owner[count] = properties[i].owner;
                _askingPrice[count] = properties[i].askingPrice;
                
                count++;
            }
        }
        
        return (_creator, _name, _desc, _id, _owner, _askingPrice);        
    }
    
    //
    // Internal functions
    //
    
    /**
     * resets the variables related to a sale process
     */
    function resetSale(uint _propertyId) internal{
        properties[map[_propertyId]].selling = false;
        properties[map[_propertyId]].sellingTo = address(0);
        properties[map[_propertyId]].askingPrice = 0;
    }
}