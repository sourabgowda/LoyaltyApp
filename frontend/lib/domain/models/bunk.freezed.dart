// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'bunk.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Bunk _$BunkFromJson(Map<String, dynamic> json) {
  return _Bunk.fromJson(json);
}

/// @nodoc
mixin _$Bunk {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get location => throw _privateConstructorUsedError;
  String get district => throw _privateConstructorUsedError;
  String get state => throw _privateConstructorUsedError;
  String get pincode => throw _privateConstructorUsedError;
  String? get managerId => throw _privateConstructorUsedError;

  /// Serializes this Bunk to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Bunk
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BunkCopyWith<Bunk> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BunkCopyWith<$Res> {
  factory $BunkCopyWith(Bunk value, $Res Function(Bunk) then) =
      _$BunkCopyWithImpl<$Res, Bunk>;
  @useResult
  $Res call(
      {String id,
      String name,
      String location,
      String district,
      String state,
      String pincode,
      String? managerId});
}

/// @nodoc
class _$BunkCopyWithImpl<$Res, $Val extends Bunk>
    implements $BunkCopyWith<$Res> {
  _$BunkCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Bunk
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? location = null,
    Object? district = null,
    Object? state = null,
    Object? pincode = null,
    Object? managerId = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      location: null == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String,
      district: null == district
          ? _value.district
          : district // ignore: cast_nullable_to_non_nullable
              as String,
      state: null == state
          ? _value.state
          : state // ignore: cast_nullable_to_non_nullable
              as String,
      pincode: null == pincode
          ? _value.pincode
          : pincode // ignore: cast_nullable_to_non_nullable
              as String,
      managerId: freezed == managerId
          ? _value.managerId
          : managerId // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$BunkImplCopyWith<$Res> implements $BunkCopyWith<$Res> {
  factory _$$BunkImplCopyWith(
          _$BunkImpl value, $Res Function(_$BunkImpl) then) =
      __$$BunkImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String location,
      String district,
      String state,
      String pincode,
      String? managerId});
}

/// @nodoc
class __$$BunkImplCopyWithImpl<$Res>
    extends _$BunkCopyWithImpl<$Res, _$BunkImpl>
    implements _$$BunkImplCopyWith<$Res> {
  __$$BunkImplCopyWithImpl(_$BunkImpl _value, $Res Function(_$BunkImpl) _then)
      : super(_value, _then);

  /// Create a copy of Bunk
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? location = null,
    Object? district = null,
    Object? state = null,
    Object? pincode = null,
    Object? managerId = freezed,
  }) {
    return _then(_$BunkImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      location: null == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String,
      district: null == district
          ? _value.district
          : district // ignore: cast_nullable_to_non_nullable
              as String,
      state: null == state
          ? _value.state
          : state // ignore: cast_nullable_to_non_nullable
              as String,
      pincode: null == pincode
          ? _value.pincode
          : pincode // ignore: cast_nullable_to_non_nullable
              as String,
      managerId: freezed == managerId
          ? _value.managerId
          : managerId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$BunkImpl implements _Bunk {
  const _$BunkImpl(
      {required this.id,
      required this.name,
      required this.location,
      required this.district,
      required this.state,
      required this.pincode,
      this.managerId});

  factory _$BunkImpl.fromJson(Map<String, dynamic> json) =>
      _$$BunkImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String location;
  @override
  final String district;
  @override
  final String state;
  @override
  final String pincode;
  @override
  final String? managerId;

  @override
  String toString() {
    return 'Bunk(id: $id, name: $name, location: $location, district: $district, state: $state, pincode: $pincode, managerId: $managerId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BunkImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.district, district) ||
                other.district == district) &&
            (identical(other.state, state) || other.state == state) &&
            (identical(other.pincode, pincode) || other.pincode == pincode) &&
            (identical(other.managerId, managerId) ||
                other.managerId == managerId));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, name, location, district, state, pincode, managerId);

  /// Create a copy of Bunk
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BunkImplCopyWith<_$BunkImpl> get copyWith =>
      __$$BunkImplCopyWithImpl<_$BunkImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$BunkImplToJson(
      this,
    );
  }
}

abstract class _Bunk implements Bunk {
  const factory _Bunk(
      {required final String id,
      required final String name,
      required final String location,
      required final String district,
      required final String state,
      required final String pincode,
      final String? managerId}) = _$BunkImpl;

  factory _Bunk.fromJson(Map<String, dynamic> json) = _$BunkImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get location;
  @override
  String get district;
  @override
  String get state;
  @override
  String get pincode;
  @override
  String? get managerId;

  /// Create a copy of Bunk
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BunkImplCopyWith<_$BunkImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
