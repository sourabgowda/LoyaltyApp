// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'bunk.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$BunkImpl _$$BunkImplFromJson(Map<String, dynamic> json) => _$BunkImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      location: json['location'] as String,
      district: json['district'] as String,
      state: json['state'] as String,
      pincode: json['pincode'] as String,
      managerId: json['managerId'] as String?,
    );

Map<String, dynamic> _$$BunkImplToJson(_$BunkImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'location': instance.location,
      'district': instance.district,
      'state': instance.state,
      'pincode': instance.pincode,
      'managerId': instance.managerId,
    };
