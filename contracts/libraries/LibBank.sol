// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct BankStorage{
    mapping(address => uint) userBalance;
}