// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'config.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

GlobalConfig _$GlobalConfigFromJson(Map<String, dynamic> json) {
  return _GlobalConfig.fromJson(json);
}

/// @nodoc
mixin _$GlobalConfig {
  double get creditPercentage => throw _privateConstructorUsedError;
  double get redemptionRate => throw _privateConstructorUsedError;

  /// Serializes this GlobalConfig to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of GlobalConfig
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $GlobalConfigCopyWith<GlobalConfig> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GlobalConfigCopyWith<$Res> {
  factory $GlobalConfigCopyWith(
          GlobalConfig value, $Res Function(GlobalConfig) then) =
      _$GlobalConfigCopyWithImpl<$Res, GlobalConfig>;
  @useResult
  $Res call({double creditPercentage, double redemptionRate});
}

/// @nodoc
class _$GlobalConfigCopyWithImpl<$Res, $Val extends GlobalConfig>
    implements $GlobalConfigCopyWith<$Res> {
  _$GlobalConfigCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of GlobalConfig
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? creditPercentage = null,
    Object? redemptionRate = null,
  }) {
    return _then(_value.copyWith(
      creditPercentage: null == creditPercentage
          ? _value.creditPercentage
          : creditPercentage // ignore: cast_nullable_to_non_nullable
              as double,
      redemptionRate: null == redemptionRate
          ? _value.redemptionRate
          : redemptionRate // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GlobalConfigImplCopyWith<$Res>
    implements $GlobalConfigCopyWith<$Res> {
  factory _$$GlobalConfigImplCopyWith(
          _$GlobalConfigImpl value, $Res Function(_$GlobalConfigImpl) then) =
      __$$GlobalConfigImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({double creditPercentage, double redemptionRate});
}

/// @nodoc
class __$$GlobalConfigImplCopyWithImpl<$Res>
    extends _$GlobalConfigCopyWithImpl<$Res, _$GlobalConfigImpl>
    implements _$$GlobalConfigImplCopyWith<$Res> {
  __$$GlobalConfigImplCopyWithImpl(
      _$GlobalConfigImpl _value, $Res Function(_$GlobalConfigImpl) _then)
      : super(_value, _then);

  /// Create a copy of GlobalConfig
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? creditPercentage = null,
    Object? redemptionRate = null,
  }) {
    return _then(_$GlobalConfigImpl(
      creditPercentage: null == creditPercentage
          ? _value.creditPercentage
          : creditPercentage // ignore: cast_nullable_to_non_nullable
              as double,
      redemptionRate: null == redemptionRate
          ? _value.redemptionRate
          : redemptionRate // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GlobalConfigImpl implements _GlobalConfig {
  const _$GlobalConfigImpl(
      {required this.creditPercentage, required this.redemptionRate});

  factory _$GlobalConfigImpl.fromJson(Map<String, dynamic> json) =>
      _$$GlobalConfigImplFromJson(json);

  @override
  final double creditPercentage;
  @override
  final double redemptionRate;

  @override
  String toString() {
    return 'GlobalConfig(creditPercentage: $creditPercentage, redemptionRate: $redemptionRate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GlobalConfigImpl &&
            (identical(other.creditPercentage, creditPercentage) ||
                other.creditPercentage == creditPercentage) &&
            (identical(other.redemptionRate, redemptionRate) ||
                other.redemptionRate == redemptionRate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, creditPercentage, redemptionRate);

  /// Create a copy of GlobalConfig
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$GlobalConfigImplCopyWith<_$GlobalConfigImpl> get copyWith =>
      __$$GlobalConfigImplCopyWithImpl<_$GlobalConfigImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GlobalConfigImplToJson(
      this,
    );
  }
}

abstract class _GlobalConfig implements GlobalConfig {
  const factory _GlobalConfig(
      {required final double creditPercentage,
      required final double redemptionRate}) = _$GlobalConfigImpl;

  factory _GlobalConfig.fromJson(Map<String, dynamic> json) =
      _$GlobalConfigImpl.fromJson;

  @override
  double get creditPercentage;
  @override
  double get redemptionRate;

  /// Create a copy of GlobalConfig
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$GlobalConfigImplCopyWith<_$GlobalConfigImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
