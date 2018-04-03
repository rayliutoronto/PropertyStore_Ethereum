pragma solidity ^0.4.19;

/**
 * Property Store
 * @author Jiangsha Liu
 */
contract Properties {
    enum SaleStatus {OnHold, OnSale, Offered}

    struct Property {
        // The creator of this property
        address creator;
        
        // Name of this property
        bytes32 name;
        
        // Long description of this property
        bytes32 desc;
        
        // ID of this property
        bytes32 id;
        
        // The owner of the property
        address owner;
        
        // Current sale status
        SaleStatus saleStatus;
        
        // Who is the selected buyer, if any.
        // Optional
        address sellingTo;
        
        // How much ether (wei) the seller has asked the buyer to send
        uint256 askingPrice;
    }
    
    // All properties listed
    Property[] private properties;
    
    // mapping between property index and id
    mapping(bytes32=>uint256) private propertyIndexMap;

    // mapping between property hash and user
    mapping(bytes32=>address) private propertyOwnerMap;
    
    //
    // Modifiers
    // 
    
    // Makes functions require the called to be the owner of the contract
    modifier onlyOwner(bytes32 _propertyId) {
        require(msg.sender == properties[propertyIndexMap[_propertyId]].owner);
        _;
    }
    
    // Add to functions that the owner wants to prevent being called while the
    // contract is for sale or offered.
    modifier ifOnHold(bytes32 _propertyId) {
        require(properties[propertyIndexMap[_propertyId]].saleStatus == SaleStatus.OnHold);
        _;
    }   

    event Register(address _creator, bytes32 _name, bytes32 _desc, bytes32 _id, address _owner, SaleStatus _saleStatus);
    event Sell(address _creator, bytes32 _name, bytes32 _desc, bytes32 _id, address _owner, SaleStatus _saleStatus, uint256 _askingPrice);
    event CancelSell(address _creator, bytes32 _name, bytes32 _desc, bytes32 _id, address _owner, SaleStatus _saleStatus);
    event Offer(uint256 _offerDate, address _creator, bytes32 _name, bytes32 _desc, bytes32 _id, address _owner, SaleStatus _saleStatus, address _sellingTo); 
    event Transfer(uint256 _transferDate, address _creator, bytes32 _name, bytes32 _desc, bytes32 _id, address _owner, SaleStatus _saleStatus, address _from);

    /**
     * @param _name is name of property
     * @param _desc is long description of property
     * @param _hash is hash string generated from content
     * 
     * id (timestamp of creation for now) of registered property is returned
     */
    function register(bytes32 _name, bytes32 _desc, bytes32 _hash) public returns (bytes32) {
        if(propertyOwnerMap[_hash] == address(0)) {
            uint256 currentSize = properties.length;

            properties.push(Property({
                creator: msg.sender, 
                name: _name, 
                desc: _desc, 
                id: _hash, 
                owner: msg.sender, 
                saleStatus: SaleStatus.OnHold, 
                sellingTo: address(0),
                askingPrice: 0
            }));
            
            require(properties.length == currentSize + 1);

            propertyIndexMap[_hash] = currentSize;

            propertyOwnerMap[_hash] = msg.sender;
        }else{
            require(propertyOwnerMap[_hash] == msg.sender);

            properties[propertyIndexMap[_hash]].name = _name;
            properties[propertyIndexMap[_hash]].desc = _desc;
        }

        emit Register(properties[propertyIndexMap[_hash]].creator, properties[propertyIndexMap[_hash]].name, properties[propertyIndexMap[_hash]].desc, properties[propertyIndexMap[_hash]].id, properties[propertyIndexMap[_hash]].owner, properties[propertyIndexMap[_hash]].saleStatus);

        return _hash;
    }
    
    /**
     * initiateSale is called by the owner of the property to start
     * the sale process.
     * @param _propertyId is id of property returned in function "register"
     * @param _price is the asking price for the sale
     * @param _to (OPTIONAL) is the address of the person that the owner
     * wants to sell the contract to. If set to 0x0, anyone can buy it.
     */
    function initiateSale(bytes32 _propertyId, uint256 _price, address _to) onlyOwner(_propertyId) ifOnHold(_propertyId) public {
        require(_to != address(this) && _to != properties[propertyIndexMap[_propertyId]].owner);
        
        properties[propertyIndexMap[_propertyId]].saleStatus = SaleStatus.OnSale;
        
        // Set the target buyer, if specified.
        properties[propertyIndexMap[_propertyId]].sellingTo = _to;
        
        properties[propertyIndexMap[_propertyId]].askingPrice = _price;

        emit Sell(properties[propertyIndexMap[_propertyId]].creator, properties[propertyIndexMap[_propertyId]].name, properties[propertyIndexMap[_propertyId]].desc, properties[propertyIndexMap[_propertyId]].id, properties[propertyIndexMap[_propertyId]].owner, properties[propertyIndexMap[_propertyId]].saleStatus, properties[propertyIndexMap[_propertyId]].askingPrice);
    }
    
    /**
     * cancelSale allows the owner to cancel the sale before someone buys
     * the contract.
     */
    function cancelSale(bytes32 _propertyId) onlyOwner(_propertyId) public {
        require(properties[propertyIndexMap[_propertyId]].saleStatus == SaleStatus.OnSale);
        
        // Reset sale variables
        resetSale(_propertyId);

        emit CancelSell(properties[propertyIndexMap[_propertyId]].creator, properties[propertyIndexMap[_propertyId]].name, properties[propertyIndexMap[_propertyId]].desc, properties[propertyIndexMap[_propertyId]].id, properties[propertyIndexMap[_propertyId]].owner, properties[propertyIndexMap[_propertyId]].saleStatus);
    }
    
    /** 
     * offer is called buy the specified buyer (or anyone if sellingTo)
     * was not set, to make the purchase.
     */
    function offer(bytes32 _propertyId) public payable {
        require(properties[propertyIndexMap[_propertyId]].saleStatus == SaleStatus.OnSale);
        require(msg.sender != properties[propertyIndexMap[_propertyId]].owner);
        require(msg.sender == properties[propertyIndexMap[_propertyId]].sellingTo || properties[propertyIndexMap[_propertyId]].sellingTo == address(0));
        require(msg.value == properties[propertyIndexMap[_propertyId]].askingPrice);
        
        properties[propertyIndexMap[_propertyId]].saleStatus = SaleStatus.Offered;
        properties[propertyIndexMap[_propertyId]].sellingTo = msg.sender;
        
        properties[propertyIndexMap[_propertyId]].owner.transfer(msg.value);
        
        emit Offer(now,properties[propertyIndexMap[_propertyId]].creator, properties[propertyIndexMap[_propertyId]].name, properties[propertyIndexMap[_propertyId]].desc, properties[propertyIndexMap[_propertyId]].id, properties[propertyIndexMap[_propertyId]].owner, properties[propertyIndexMap[_propertyId]].saleStatus, properties[propertyIndexMap[_propertyId]].sellingTo);
    }

    /** 
     * completeSale is called buy the owner to complete.
     */
    function completeSale(bytes32 _propertyId) onlyOwner(_propertyId) public {
        require(properties[propertyIndexMap[_propertyId]].saleStatus == SaleStatus.Offered);
        
        // Swap ownership
        address prevOwner = properties[propertyIndexMap[_propertyId]].owner;
        address newOwner = properties[propertyIndexMap[_propertyId]].sellingTo;
        properties[propertyIndexMap[_propertyId]].owner = newOwner;
        
        // Transaction cleanup
        resetSale(_propertyId);
        
        emit Transfer(now,properties[propertyIndexMap[_propertyId]].creator, properties[propertyIndexMap[_propertyId]].name, properties[propertyIndexMap[_propertyId]].desc, properties[propertyIndexMap[_propertyId]].id, properties[propertyIndexMap[_propertyId]].owner, properties[propertyIndexMap[_propertyId]].saleStatus, prevOwner);
    }

    /**
     * 
     * return all properties owned by msg.sender, including those created/registered by msg.sender.
     * 
     * 
     */
    function listAllMyProperties() public view returns(address[], bytes32[], bytes32[], bytes32[], SaleStatus[], address[], uint256[]) {
        uint256 count = 0;
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].owner == msg.sender) {
                count++;
            }
        }
        
        address[] memory _creator = new address[](count);
        bytes32[] memory _name = new bytes32[](count);
        bytes32[] memory _desc = new bytes32[](count);
        bytes32[] memory _id = new bytes32[](count);
        SaleStatus[] memory _saleStatus = new SaleStatus[](count);
        address[] memory _sellingTo = new address[](count);
        uint256[] memory _askingPrice = new uint256[](count);

        count = 0;
        for (i = 0; i < properties.length && count < _id.length; i++) {
            if (properties[i].owner == msg.sender) {
                _creator[count] = properties[i].creator;
                _name[count] = properties[i].name;
                _desc[count] = properties[i].desc;
                _id[count] = properties[i].id;
                _saleStatus[count] = properties[i].saleStatus;
                _sellingTo[count] = properties[i].sellingTo;
                _askingPrice[count] = properties[i].askingPrice;

                count++;
            }
        }
        
        return (_creator, _name, _desc, _id, _saleStatus, _sellingTo, _askingPrice);
    }

 

    /**
     * 
     * return all properties could be bought by msg.sender.
     * 
     * 
     */
    function listAllBuyableProperties() public view returns(address[], bytes32[], bytes32[], bytes32[], address[], uint256[]){
        uint256 count = 0;
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].saleStatus == SaleStatus.OnSale && properties[i].owner != msg.sender && (properties[i].sellingTo == address(0) || properties[i].sellingTo == msg.sender)) {
                count++;
            }
        }
        
        address[] memory _creator = new address[](count);
        bytes32[] memory _name = new bytes32[](count);
        bytes32[] memory _desc = new bytes32[](count);
        bytes32[] memory _id = new bytes32[](count);
        address[] memory _owner = new address[](count);
        uint256[] memory _askingPrice = new uint256[](count);

        count = 0;
        for (i = 0; i < properties.length; i++) {
            if (properties[i].saleStatus == SaleStatus.OnSale && properties[i].owner != msg.sender && (properties[i].sellingTo == address(0) || properties[i].sellingTo == msg.sender)) {
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

    /****
    * get owner of this hash string generated from property content
    */
    function getOwner(bytes32 _hash) public view returns(address) {
        return propertyOwnerMap[_hash];
    }
    
    //
    // Internal functions
    //
    
    /**
     * resets the variables related to a sale process
     */
    function resetSale(bytes32 _propertyId) internal {
        properties[propertyIndexMap[_propertyId]].saleStatus = SaleStatus.OnHold;
        properties[propertyIndexMap[_propertyId]].sellingTo = address(0);
        properties[propertyIndexMap[_propertyId]].askingPrice = 0;
    }
}