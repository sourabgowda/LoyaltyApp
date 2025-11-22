import 'package:freezed_annotation/freezed_annotation.dart';

part 'bunk.freezed.dart';
part 'bunk.g.dart';

@freezed
abstract class Bunk with _$Bunk {
  const factory Bunk({
    required String id,
    required String name,
    required String location,
    required String district,
    required String state,
    required String pincode,
    String? managerId,
  }) = _Bunk;

  factory Bunk.fromJson(Map<String, dynamic> json) => _$BunkFromJson(json);
}
