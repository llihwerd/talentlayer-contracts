// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

import "../interfaces/IJobRegistry.sol";
import "../interfaces/ITalentLayerID.sol";

contract TalentLayerEscrow {

    // =========================== Enum ==============================

    // =========================== Struct ==============================

    struct Transaction {
        address sender;
        address receiver;
        address token;
        uint256 amount;
    }



    // =========================== Events ==============================

    // =========================== Declarations ==============================
    Transaction[] private transactions;
    address private jobRegistryAddress;
    address private talentLayerIDAddress;

    // =========================== Constructor ==============================

    constructor(
        address _jobRegistryAddress,
        address _talentLayerIDAddress
    ) {
        _setJobRegistryAddress(_jobRegistryAddress);
        _setTalentLayerIDAddress(_talentLayerIDAddress);
    }


    // =========================== View functions ==============================

    

    // =========================== User functions ==============================
    
    function createETHTransaction(
        uint256 _jobId,
        uint256 _proposalId
    ) external payable {
        IJobRegistry.Proposal memory proposal = _getProposal(_jobId, _proposalId);
        IJobRegistry.Job memory job = _getJob(_jobId);
        address sender = ITalentLayerID(talentLayerIDAddress).ownerOf(job.employerId);
        address receiver = ITalentLayerID(talentLayerIDAddress).ownerOf(proposal.employeeId);

        require(msg.sender == sender, "Access denied.");
        require(msg.value == proposal.rateAmount, "Non-matching funds");
        require(proposal.rateToken == address(0), "Non-matching token");

        uint256 transactionId = _saveTransaction(sender, receiver, proposal.rateToken, proposal.rateAmount);
        IJobRegistry(jobRegistryAddress).afterDeposit(_jobId, _proposalId, transactionId); 
        // _deposit(sender, proposal.rateToken, proposal.rateAmount); 
    }

    function createTokenTransaction(
        uint256 _jobId,
        uint256 _proposalId
    ) external {
        IJobRegistry.Proposal memory proposal = _getProposal(_jobId, _proposalId);
        IJobRegistry.Job memory job = _getJob(_jobId);
        address sender = ITalentLayerID(talentLayerIDAddress).ownerOf(job.employerId);
        address receiver = ITalentLayerID(talentLayerIDAddress).ownerOf(proposal.employeeId);

        uint256 transactionId = _saveTransaction(sender, receiver, proposal.rateToken, proposal.rateAmount);
        IJobRegistry(jobRegistryAddress).afterDeposit(_jobId, _proposalId, transactionId); 
        _deposit(sender, proposal.rateToken, proposal.rateAmount); 
    }


    function release(
        uint256 _transactionId,
        uint256 _amount
    ) external {
        Transaction storage transaction = transactions[_transactionId];

        require(transaction.sender == msg.sender, "Access denied.");
        require(transaction.amount >= _amount, "Insufficient funds.");

        transaction.amount -= _amount;
        _release(transaction.receiver, transaction.token, _amount);
    }

    function reimburse(
        uint256 _transactionId,
        uint256 _amount
    ) external {
        Transaction storage transaction = transactions[_transactionId];

        require(transaction.receiver == msg.sender, "Access denied.");
        require(transaction.amount >= _amount, "Insufficient funds.");

        transaction.amount -= _amount;
        _release(transaction.sender, transaction.token, _amount);
    }



    // =========================== Private functions ==============================


    function _setJobRegistryAddress(
        address _jobRegistryAddress
    ) private {
        jobRegistryAddress = _jobRegistryAddress;
    }

    function _setTalentLayerIDAddress(
        address _talentLayerIDAddress
    ) private {
        talentLayerIDAddress = _talentLayerIDAddress;
    }
    
    function _saveTransaction(
        address _sender, 
        address _receiver,
        address _token,
        uint256 _amount
    ) private returns (uint256){
        transactions.push(
            Transaction({
                sender: _sender,
                receiver: _receiver,
                token: _token,
                amount: _amount
            })
        );
        return transactions.length -1;
    }
    
    function _deposit(
        address _sender, 
        address _token,
        uint256 _amount
    ) private {
        require(
            IERC20(_token).transferFrom(_sender, address(this), _amount), 
            "Transfer must not fail"
        );
    }

    function _release(
        address _receiver,
        address _token,
        uint256 _amount
    ) private {
        if(_token == address(0)){
            payable(_receiver).transfer(_amount);
        } else {
            require(
                IERC20(_token).transfer(_receiver, _amount), 
                "Transfer must not fail"
            );
        }
    }

    function _getProposal(
        uint256 _jobId, uint256 _proposalId
    ) private view returns (IJobRegistry.Proposal memory){
        return IJobRegistry(jobRegistryAddress).getProposal(_jobId, _proposalId);
    }

    function _getJob(
        uint256 _jobId
    ) private view returns (IJobRegistry.Job memory){
        return IJobRegistry(jobRegistryAddress).getJob(_jobId);
    }

}